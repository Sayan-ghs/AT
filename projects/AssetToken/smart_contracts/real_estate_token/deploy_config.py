"""
Deployment configuration for RealEstateToken contract.
Run with: algokit project deploy   (localnet / testnet / mainnet)

Environment variables expected (localnet auto-provides them):
  DEPLOYER_MNEMONIC  – mnemonic of the deployer / admin account
  ALGOD_SERVER       – algod endpoint (default: http://localhost:4001)
  ALGOD_TOKEN        – algod API token
  ADMIN_ADDRESS      – (optional) transfer admin rights to this address after deploy
"""

import logging

import algokit_utils

logger = logging.getLogger(__name__)


def deploy() -> None:
    """
    Deploy or update the RealEstateToken contract.

    Behaviour
    ---------
    - On first run  : creates the application and funds the contract address.
    - On re-run     : AppendApp strategy appends a new app (preserves history).

    The deployer becomes the on-chain admin inside the contract's global state
    (set in the create bare-call executed automatically by AlgoKit deployer).
    """
    from smart_contracts.artifacts.real_estate_token.real_estate_token_client import (
        RealEstateTokenFactory,
    )

    algorand = algokit_utils.AlgorandClient.from_environment()
    deployer = algorand.account.from_environment("DEPLOYER")

    factory = algorand.client.get_typed_app_factory(
        RealEstateTokenFactory,
        default_sender=deployer.address,
    )

    app_client, result = factory.deploy(
        on_update=algokit_utils.OnUpdate.AppendApp,
        on_schema_break=algokit_utils.OnSchemaBreak.AppendApp,
    )

    # Fund the contract address on first creation so it can:
    #  - Hold the minimum balance for the ASA it will create
    #  - Pay for inner transaction fees
    #  - Hold rent ALGO
    if result.operation_performed in [
        algokit_utils.OperationPerformed.Create,
        algokit_utils.OperationPerformed.Replace,
    ]:
        # 0.1 ALGO seed: covers min-balance (0.1) for the new contract
        seed_amount = algokit_utils.AlgoAmount(algo=0.1)
        algorand.send.payment(
            algokit_utils.PaymentParams(
                amount=seed_amount,
                sender=deployer.address,
                receiver=app_client.app_address,
            )
        )
        logger.info(
            f"Funded contract {app_client.app_name} ({app_client.app_address}) "
            f"with {seed_amount} ALGO"
        )

    logger.info(
        f"Deployed {app_client.app_name} – App ID: {app_client.app_id} | "
        f"Address: {app_client.app_address} | "
        f"Operation: {result.operation_performed}"
    )

    # Optionally transfer admin rights to a different wallet (e.g. Pera wallet)
    # Only do this on first creation; skip if the contract already existed.
    import os
    import algosdk
    admin_address = os.environ.get("ADMIN_ADDRESS", "").strip()
    if admin_address and result.operation_performed in [
        algokit_utils.OperationPerformed.Create,
        algokit_utils.OperationPerformed.Replace,
    ]:
        logger.info(f"Transferring admin rights to {admin_address}")
        sp = algorand.client.algod.suggested_params()
        method = algosdk.abi.Method.from_signature("transfer_admin(address)void")
        atc = algosdk.atomic_transaction_composer.AtomicTransactionComposer()
        signer = algosdk.atomic_transaction_composer.AccountTransactionSigner(
            algosdk.mnemonic.to_private_key(
                os.environ.get("DEPLOYER_MNEMONIC", "")
            )
        )
        atc.add_method_call(
            app_id=app_client.app_id,
            method=method,
            sender=deployer.address,
            sp=sp,
            signer=signer,
            method_args=[admin_address],
        )
        atc.execute(algorand.client.algod, 5)
        logger.info(f"Admin rights transferred to {admin_address}")
