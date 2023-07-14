const solana = require('@solana/web3.js');
const solanaSPL = require('@solana/spl-token');
const ethereum = require('ethers');

/*
    Solana
    Bitcoin
    Etherum
    Litecoin
    Monero
    USDC
    USDT
*/

/*
const erc20Abi = [
    // Some details about the token
    "function name() view returns (string)",
    "function symbol() view returns (string)",

    // Get the account balance
    "function balanceOf(address) view returns (uint)",

    // Send some of your tokens to someone else
    "function transfer(address to, uint amount)",

    // An event triggered whenever anyone transfers to someone else
    "event Transfer(address indexed from, address indexed to, uint amount)"
];
*/

const solanaNetwork = new solana.Connection(solana.clusterApiUrl('devnet'), 'confirmed');
//const ethereumNetwork = new ethereum.providers.InfuraProvider('ropsten', 'PROJECT-ID');
const solanaTokens = {
    "USDC": new solana.PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
    "USDT": new solana.PublicKey("Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB"),
    "mSOL": new solana.PublicKey("mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So"),
    "WBTC": new solana.PublicKey("3NZ9JMVBmGAqocybic2c7LQCJScmgsAZ6vQqTDzcqmJh"),
    "WETH": new solana.PublicKey("7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs"),
};

async function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function sendSolana(wallet, to, amount) {
    const transaction = new solana.Transaction().add(
        solana.SystemProgram.transfer({
            fromPubkey: wallet.publicKey,
            toPubkey: to,
            lamports: amount * solana.LAMPORTS_PER_SOL
        })
    );
    const signature = await solana.sendAndConfirmTransaction(
        solanaNetwork,
        transaction,
        [wallet]
    );
    return signature;
}

async function sendSolanaToken(wallet, to, amount, mint) {
    mint = new solana.PublicKey(mint);
    const fromTokenAccount = solanaSPL.getAssociatedTokenAddressSync(mint, wallet.publicKey);
    const toTokenAccount = solanaSPL.getAssociatedTokenAddressSync(mint, to);

    const mintInfo = await solanaSPL.getMint(
        solanaNetwork,
        mint
    );

    const signature = await solanaSPL.transfer(
        solanaNetwork,
        wallet,
        fromTokenAccount,
        toTokenAccount,
        wallet.publicKey,
        amount * (10 ** mintInfo.decimals)
    );
    return signature;
}

async function disassembleSolanaTransaction(signature) {
    const transactionInfo = await network.getParsedTransaction(signature);
    const transactions = transactionInfo.transaction.message.instructions;
    for (const instruction of transactions) {
        if (instruction.hasOwnProperty('parsed') && instruction.parsed.hasOwnProperty('type') && instruction.parsed.type === 'transfer') {
            const transfer = instruction.parsed.info;
            return transfer; //Fix to standardize struct
        }
    }
    return null;
} //Works for both SPL and main

async function watchSolanaTransactions(wallet, action, mint=undefined) {
    return solanaNetwork.onLogs(
        mint === undefined ? wallet.publicKey : solanaSPL.getAssociatedTokenAddressSync(new solana.PublicKey(mint), new solana.PublicKey(wallet.publicKey)),
        async (logs, context) => {
            try {
                const transfer = await disassembleSolanaTransaction(logs.signature);
                if (transfer !== null) {
                    action(transfer);
                }
            } catch (err) {
                console.error(`Failed to read transaction: ${err}`);
            }
        },
        "confirmed"
    )
}


/*
async function sendEthereum(wallet, to, amount) {
    let transaction = {
        to: to,
        value: ethereum.utils.parseEther(amount)
    };
    let result = await wallet.sendTransaction(transaction);
    return result.hash;
}

async function sendEthereumToken(wallet, to, amount, mint, decimals) {
    const contract = new ethereum.Contract(mint, erc20Abi, wallet);
    const amountToSend = ethereum.utils.parseUnits(amount, decimals); //Change decimal
    const transactionResponse = await contract.transfer(to, amountToSend);
    const transactionReceipt = await transactionResponse.wait();
    return transactionReceipt.transactionHash;
}

async function disassembleEthereumTransaction(signature, token=false) {
    if (!token) {
        return await ethereumNetwork.getTransaction(signautre);
    } else {
        const transaction = await ethereumNetwork.getTransaction(signature);
        const contractInterface = new ethereum.utils.Interface(erc20Abi);
        const decoded = contractInterface.parseTransaction(transaction);
        return {
            to: decoded.args[0],
            amount: decoded.args[1]
        };
    }
    return undefined;
}

async function watchEthereumTransactions(wallet, action) {
    const normalizeAddress = ethereum.utils.getAddress(wallet);
    const filter = { address: normalizeAddress };
    return ethereumNetwork.on(filter, (result) => {
        action(result);
    });
}
*/



module.exports = {
    solanaNetwork,
    solanaTokens,
    sendSolana,
    sendSolanaToken,
    watchSolanaTransactions
};