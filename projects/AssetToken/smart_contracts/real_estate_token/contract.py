"""
RealEstate Token Smart Contract
================================
ARC-4 compliant fractional real estate ownership on Algorand.

Architecture
------------
- One ASA represents the real estate asset, split into N fungible tokens.
- This contract is the Manager, Freeze, and Clawback authority of the ASA.
- Only KYC-verified investors (flagged by admin) can purchase tokens.
- Rent ALGO accumulates on-chain; holders can claim proportional shares.
- Admin controls: create asset, verify/freeze investors, deposit rent, clawback tokens.

Compiler: algorand-python (puyapy) v3+
ABI: ARC-4
"""

from algopy import (
    ARC4Contract,
    Account,
    Asset,
    Bytes,
    Global,
    GlobalState,
    LocalState,
    Txn,
    UInt64,
    gtxn,
    itxn,
)
from algopy.arc4 import abimethod, baremethod


class RealEstateToken(ARC4Contract):
    """
    Fractional real estate tokenisation contract.

    Global schema (7 keys):
      admin               – deployer / admin Account
      asset_id            – ASA ID (0 until create_property_asset is called)
      total_tokens        – total supply minted at creation
      price_per_token     – price in microALGO per one token unit
      tokens_sold         – running count of tokens transferred to buyers
      rent_pool           – microALGO available for distribution
      rent_deposit_round  – round of the last rent deposit (anti-double-claim)
      metadata_hash       – arbitrary bytes hash of property metadata

    Local schema (3 keys, per opted-in account):
      tokens_owned        – ASA balance as tracked by contract
      is_verified         – KYC flag: 0 = unverified, 1 = verified
      last_claim_round    – round of the last rent deposit claimed
    """

    # -----------------------------------------------------------------
    # State declarations  (instantiated in __init__)
    # -----------------------------------------------------------------

    def __init__(self) -> None:
        # --- Global state ---
        self.admin = GlobalState(Account, key="admin")
        self.asset_id = GlobalState(UInt64, key="asset_id")
        self.total_tokens = GlobalState(UInt64, key="total_tokens")
        self.price_per_token = GlobalState(UInt64, key="price_per_token")
        self.tokens_sold = GlobalState(UInt64, key="tokens_sold")
        self.rent_pool = GlobalState(UInt64, key="rent_pool")
        self.metadata_hash = GlobalState(Bytes, key="metadata_hash")
        self.rent_deposit_round = GlobalState(UInt64, key="rent_deposit_round")

        # --- Local state (per account) ---
        self.tokens_owned = LocalState(UInt64, key="tokens_owned")
        self.is_verified = LocalState(UInt64, key="is_verified")
        self.last_claim_round = LocalState(UInt64, key="last_claim_round")

    # =================================================================
    # Lifecycle
    # =================================================================

    @baremethod(create="require")
    def create(self) -> None:
        """
        Deploy the contract.
        Sets admin to the deployer and initialises all counters to zero.
        Must be called as a bare (no-argument) application call on creation.
        """
        self.admin.value = Txn.sender
        self.tokens_sold.value = UInt64(0)
        self.rent_pool.value = UInt64(0)
        self.asset_id.value = UInt64(0)
        self.rent_deposit_round.value = UInt64(0)
        # metadata_hash and total_tokens are set later in create_property_asset

    @baremethod(allow_actions=["OptIn"])
    def opt_in(self) -> None:
        """
        Allow any account to opt into the contract's local state.
        Initialises all local counters to zero.
        Accounts must opt in before they can be verified or purchase tokens.
        """
        self.tokens_owned[Txn.sender] = UInt64(0)
        self.is_verified[Txn.sender] = UInt64(0)
        self.last_claim_round[Txn.sender] = UInt64(0)

    @baremethod(allow_actions=["CloseOut"])
    def close_out(self) -> None:
        """
        Allow accounts to close out of local state.
        Safety check: user must hold zero tokens before closing out.
        """
        assert self.tokens_owned[Txn.sender] == UInt64(0), "Must hold zero tokens to close out"

    # =================================================================
    # Admin – Property Asset Creation
    # =================================================================

    @abimethod()
    def create_property_asset(
        self,
        total_supply: UInt64,
        price: UInt64,
        meta_hash: Bytes,
    ) -> UInt64:
        """
        Admin-only.  Creates the ASA representing the tokenised property.

        Inner transaction details:
          - Total supply  = total_supply (0 decimals → whole tokens only)
          - Freeze/Clawback/Manager/Reserve → contract address (full control)
          - Default frozen = False (so normal opt-in + buy flow works)

        Parameters
        ----------
        total_supply : number of fractional token units to mint
        price        : price per token in microALGO
        meta_hash    : arbitrary SHA-256 hash of off-chain property metadata

        Returns
        -------
        The newly created ASA ID.
        """
        # ---- Access control ----
        assert Txn.sender == self.admin.value, "Only admin can create asset"

        # ---- One-time creation guard ----
        assert self.asset_id.value == UInt64(0), "Property asset already created"

        # ---- Sanity checks ----
        assert total_supply > UInt64(0), "Supply must be > 0"
        assert price > UInt64(0), "Price per token must be > 0"

        # ---- Store supply configuration ----
        self.total_tokens.value = total_supply
        self.price_per_token.value = price
        self.metadata_hash.value = meta_hash

        # ---- Inner transaction: create ASA ----
        # The contract is the sole authority; it will transfer tokens to buyers
        # and can freeze/clawback non-compliant accounts.
        created = itxn.AssetConfig(
            total=total_supply,
            decimals=0,               # whole units only – no fractional tokens
            default_frozen=False,
            manager=Global.current_application_address,
            freeze=Global.current_application_address,
            clawback=Global.current_application_address,
            reserve=Global.current_application_address,
            asset_name=b"RealEstateToken",
            unit_name=b"RET",
            fee=Global.min_txn_fee,
        ).submit()

        new_asset_id = created.created_asset.id
        self.asset_id.value = new_asset_id
        return new_asset_id

    # =================================================================
    # Admin – Update Price
    # =================================================================

    @abimethod()
    def update_price(self, new_price: UInt64) -> None:
        """
        Admin-only.  Updates the price per token in microALGO.

        Parameters
        ----------
        new_price : new price per token in microALGO (e.g. 2_000_000 = 2 ALGO)
        """
        assert Txn.sender == self.admin.value, "Only admin can update price"
        assert new_price > UInt64(0), "Price must be > 0"
        self.price_per_token.value = new_price

    # =================================================================
    # Admin – KYC / Investor Verification
    # =================================================================

    @abimethod()
    def verify_investor(self, investor: Account) -> None:
        """
        Admin-only.  Sets the KYC flag for a given account.

        The investor must already be opted into the contract's local state.
        Only verified investors can call buy_tokens.

        Parameters
        ----------
        investor : the account to mark as verified
        """
        assert Txn.sender == self.admin.value, "Only admin can verify investors"
        # Ensure the account has opted into local state (slot must exist)
        assert investor.is_opted_in(Global.current_application_id), \
            "Investor must opt in to contract first"

        self.is_verified[investor] = UInt64(1)

    # =================================================================
    # User – Buy Tokens (grouped transaction)
    # =================================================================

    @abimethod()
    def buy_tokens(self, quantity: UInt64) -> None:
        """
        Purchase `quantity` ASA tokens.

        Caller must submit a GROUP of exactly 2 transactions:
          Index 0 – PaymentTransaction  (ALGO → contract address)
          Index 1 – ApplicationCall     (this method)

        Requirements
        ------------
        - Caller must be KYC-verified (is_verified == 1)
        - Caller must have opted in to the ASA before calling
        - Payment amount == quantity × price_per_token
        - Enough tokens must still be available (total_tokens - tokens_sold)
        - asset_id must be set (create_property_asset was called)

        Internal flow
        -------------
        1. Verify the group has exactly 2 txns and current txn is at index 1.
        2. Validate payment amount.
        3. Transfer ASA from contract to buyer via AssetTransfer inner txn.
        4. Update tokens_sold and tokens_owned[buyer].
        """
        # ---- KYC gate ----
        assert self.is_verified[Txn.sender] == UInt64(1), "Investor not KYC-verified"

        # ---- Asset guard ----
        assert self.asset_id.value != UInt64(0), "Property asset not yet created"

        # ---- Quantity guard ----
        assert quantity > UInt64(0), "Quantity must be > 0"
        available = self.total_tokens.value - self.tokens_sold.value
        assert available >= quantity, "Not enough tokens remaining"

        # ---- Group transaction validation ----
        # The group must be exactly: [Payment, AppCall(buy_tokens)]
        assert Global.group_size == UInt64(2), "Must be a group of exactly 2 transactions"
        assert Txn.group_index == UInt64(1), "App call must be at group index 1"

        # ---- Retrieve payment transaction (at group index 0) ----
        payment = gtxn.PaymentTransaction(0)
        assert payment.receiver == Global.current_application_address, \
            "Payment receiver must be the contract"
        expected_amount = quantity * self.price_per_token.value
        assert payment.amount == expected_amount, "Payment amount mismatch"

        # ---- Check buyer has opted into the ASA ----
        # Wrap asset_id in the Asset type so we can call is_opted_in on the account
        asa = Asset(self.asset_id.value)
        assert Txn.sender.is_opted_in(asa), "Buyer must opt in to ASA first"

        # ---- Inner transaction: transfer ASA tokens to buyer ----
        itxn.AssetTransfer(
            xfer_asset=self.asset_id.value,
            asset_receiver=Txn.sender,
            asset_amount=quantity,
            fee=Global.min_txn_fee,
        ).submit()

        # ---- State updates ----
        self.tokens_sold.value += quantity
        self.tokens_owned[Txn.sender] = self.tokens_owned[Txn.sender] + quantity

    # =================================================================
    # Admin – Deposit Rent
    # =================================================================

    @abimethod()
    def deposit_rent(self) -> None:
        """
        Admin deposits ALGO rent into the contract's rent pool.

        Must be submitted as a GROUP of exactly 2 transactions:
          Index 0 – PaymentTransaction  (ALGO → contract address, from admin)
          Index 1 – ApplicationCall     (this method)

        The deposited amount is added to rent_pool, and rent_deposit_round is
        updated to the current round.  Token holders may claim their share
        after this point (rate-limited to one claim per deposit event).
        """
        assert Txn.sender == self.admin.value, "Only admin can deposit rent"

        # ---- Group transaction validation ----
        assert Global.group_size == UInt64(2), "Must be a group of exactly 2 transactions"
        assert Txn.group_index == UInt64(1), "App call must be at group index 1"

        payment = gtxn.PaymentTransaction(0)
        assert payment.receiver == Global.current_application_address, \
            "Payment receiver must be the contract"
        assert payment.amount > UInt64(0), "Must deposit a non-zero amount"

        # ---- Update rent pool ----
        # Guard against integer overflow: total rents must fit in a UInt64
        new_rent = self.rent_pool.value + payment.amount
        assert new_rent >= self.rent_pool.value, "Rent pool overflow"
        self.rent_pool.value = new_rent

        # ---- Stamp the deposit round (used as anti-double-claim checkpoint) ----
        self.rent_deposit_round.value = Global.round

    # =================================================================
    # User – Claim Rent
    # =================================================================

    @abimethod()
    def claim_rent(self) -> UInt64:
        """
        Proportional rent claim for a verified token holder.

        Calculation
        -----------
        share = (tokens_owned × rent_pool) ÷ total_tokens

        Integer arithmetic note: multiply first, then divide to maximise
        precision (no fractions are lost beyond the final division).

        Anti-double-claim
        -----------------
        Each deposit event is identified by `rent_deposit_round`.
        The user's `last_claim_round` is set to `rent_deposit_round` after
        a successful claim.  A second claim is blocked until a new deposit
        advances `rent_deposit_round`.

        Returns
        -------
        The microALGO amount sent to the caller.
        """
        # ---- Preconditions ----
        assert self.is_verified[Txn.sender] == UInt64(1), "Investor not KYC-verified"
        assert self.tokens_owned[Txn.sender] > UInt64(0), "No tokens owned"
        assert self.rent_pool.value > UInt64(0), "Rent pool is empty"

        # ---- Anti-double-claim gate ----
        assert self.last_claim_round[Txn.sender] < self.rent_deposit_round.value, \
            "Already claimed for the current rent deposit"

        # ---- Proportional share calculation ----
        # Multiply first to preserve precision (integer arithmetic)
        owned = self.tokens_owned[Txn.sender]
        share = (owned * self.rent_pool.value) // self.total_tokens.value
        assert share > UInt64(0), "Calculated claim is zero"

        # ---- Claim checkpoint update (BEFORE payout to follow CEI pattern) ----
        self.last_claim_round[Txn.sender] = self.rent_deposit_round.value

        # ---- Inner transaction: send ALGO to claimant ----
        itxn.Payment(
            receiver=Txn.sender,
            amount=share,
            fee=Global.min_txn_fee,
        ).submit()

        return share

    # =================================================================
    # Admin – Freeze Account (AML/Compliance)
    # =================================================================

    @abimethod()
    def freeze_account(self, target: Account) -> None:
        """
        Admin-only.  Freezes the target account's ASA holdings.

        After freezing, the account can no longer transfer the ASA without
        an explicit unfreeze by the contract (the sole Freeze Authority).
        This is the on-chain AML/compliance mechanism.

        Parameters
        ----------
        target : account to freeze
        """
        assert Txn.sender == self.admin.value, "Only admin can freeze accounts"
        assert self.asset_id.value != UInt64(0), "No asset to freeze"

        itxn.AssetFreeze(
            freeze_asset=self.asset_id.value,
            freeze_account=target,
            frozen=True,
            fee=Global.min_txn_fee,
        ).submit()

    @abimethod()
    def unfreeze_account(self, target: Account) -> None:
        """
        Admin-only.  Unfreezes a previously frozen account.

        Parameters
        ----------
        target : account to unfreeze
        """
        assert Txn.sender == self.admin.value, "Only admin can unfreeze accounts"
        assert self.asset_id.value != UInt64(0), "No asset"

        itxn.AssetFreeze(
            freeze_asset=self.asset_id.value,
            freeze_account=target,
            frozen=False,
            fee=Global.min_txn_fee,
        ).submit()

    # =================================================================
    # Admin – Clawback Tokens (Regulatory / Court Order)
    # =================================================================

    @abimethod()
    def clawback_tokens(self, target: Account, amount: UInt64) -> None:
        """
        Admin-only.  Claws back `amount` tokens from `target` to the contract.

        The contract is the Clawback Authority on the ASA, which gives it
        the power to forcibly revoke tokens.  This should only be exercised
        under legal obligation (e.g. liquidation, court order).

        After clawback the contract holds the returned tokens, which can be
        re-sold or destroyed in a future administrative action.

        Parameters
        ----------
        target : account whose tokens are being revoked
        amount : number of tokens to clawback
        """
        assert Txn.sender == self.admin.value, "Only admin can clawback tokens"
        assert self.asset_id.value != UInt64(0), "No asset exists"
        assert amount > UInt64(0), "Clawback amount must be > 0"
        assert self.tokens_owned[target] >= amount, "Target owns fewer tokens than requested"

        # ---- Inner transaction: clawback ASA from target back to contract ----
        itxn.AssetTransfer(
            xfer_asset=self.asset_id.value,
            asset_sender=target,           # the "from" party in a clawback
            asset_receiver=Global.current_application_address,
            asset_amount=amount,
            fee=Global.min_txn_fee,
        ).submit()

        # ---- Update local + global accounting ----
        self.tokens_owned[target] = self.tokens_owned[target] - amount
        self.tokens_sold.value = self.tokens_sold.value - amount

    # =================================================================
    # Read-only helpers (ABI view methods)
    # =================================================================

    # =================================================================
    # Admin – Transfer admin rights
    # =================================================================

    @abimethod()
    def transfer_admin(self, new_admin: Account) -> None:
        """
        Admin-only.  Transfer admin rights to a new address.
        Useful for handing control from the deployer key to a wallet address.
        """
        assert Txn.sender == self.admin.value, "Only admin can transfer admin rights"
        self.admin.value = new_admin

    # =================================================================
    # Read-only helpers (ABI view methods)
    # =================================================================

    @abimethod(readonly=True)
    def estimate_claimable_rent(self, investor: Account) -> UInt64:
        """
        Returns the claimable ALGO share for `investor` without any state mutation.
        Returns 0 if the investor has already claimed, holds no tokens, or rent
        pool is empty.

        Frontend uses this as a "simulate" call to show estimated yield.
        """
        if self.rent_pool.value == UInt64(0):
            return UInt64(0)
        if self.tokens_owned[investor] == UInt64(0):
            return UInt64(0)
        if self.last_claim_round[investor] >= self.rent_deposit_round.value:
            return UInt64(0)
        owned = self.tokens_owned[investor]
        return (owned * self.rent_pool.value) // self.total_tokens.value
