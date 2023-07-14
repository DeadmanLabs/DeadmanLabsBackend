const request = require('supertest');
const solana = require('@solana/web3.js');
const solanaSPL = require('@solana/spl-token');
const app = require("../index.js");
const payments = require("../payments.js");

async function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

async function createTestToken(wallet) {
    const airdropSignature = await payments.solanaNetwork.requestAirdrop(
        wallet.publicKey,
        solana.LAMPORTS_PER_SOL * 2
    );
    //We can just confirm and not disassemble because we trust the integrity of the transaction
    //If it was a transaction from somebody else, then we would need to confirm
    await payments.solanaNetwork.confirmTransaction(airdropSignature);
    const mint = await solanaSPL.createMint(
        payments.solanaNetwork,
        wallet,
        wallet.publicKey,
        wallet.publicKey,
        2
    );
    let mintInfo = await solanaSPL.getMint(
        payments.solanaNetwork,
        mint
    );
    const tokenAccount = await solanaSPL.getOrCreateAssociatedTokenAccount(
        payments.solanaNetwork,
        wallet,
        mint,
        wallet.publicKey
    );
    const tokenAccountInfo = await solanaSPL.getAccount(
        payments.solanaNetwork,
        tokenAccount.address
    );
    const mintStatus = await solanaSPL.mintTo(
        payments.solanaNetwork,
        wallet,
        mint,
        tokenAccount.address,
        wallet.publicKey,
        1000 * (10 ** mintInfo.decimals)
    );
    mintInfo = solanaSPL.getMint(
        payments.solanaNetwork,
        mint
    );
    return mint;
}

async function mintTestToken(wallet, mint, amount) {
    mint = new solana.PublicKey(mint);
    let mintInfo = await solanaSPL.getMint(
        payments.solanaNetwork,
        mint
    );
    let tokenAccount = solanaSPL.getAssociatedTokenAddressSync(mint, new solana.PublicKey(wallet.publicKey));
    const mintStatus = await solanaSPL.mintTo(
        payments.solanaNetwork,
        wallet,
        mint,
        tokenAccount,
        wallet.publicKey,
        amount * (10 ** mintInfo.decimals)
    );
    return mintStatus;
}

/*
beforeEach(async () => {
    console.log('Testing...');
});

afterEach(async () => {
    console.log('Done!');
});
*/

describe("GET /", () => {
    it("should return dictionary", async () => {
        const res = await request(app).get("/");
        expect(res.statusCode).toBe(200);
    });
});

describe("POST /", () => {
    it("should return the provided message", async () => {
        const res = await request(app).post("/").send({
            message: "Test message!"
        });
        expect(res.statusCode).toBe(200);
    });
});

test('Solana Send Payment', async () => {
    const walletPrimary = solana.Keypair.generate();
    const walletSecondary = solana.Keypair.generate();
    const airdropSignature = await payments.solanaNetwork.requestAirdrop(
        walletPrimary.publicKey,
        solana.LAMPORTS_PER_SOL
    );
    await sleep(1000);
    await payments.solanaNetwork.confirmTransaction(airdropSignature);
    const response = await payments.sendSolana(walletPrimary, walletSecondary.publicKey, 0.5);
    await sleep(1000);
    expect(typeof response).toBe('string');
    let balanceSecondary = await payments.solanaNetwork.getBalance(walletSecondary.publicKey);
    await sleep(1000);
    balanceSecondary = balanceSecondary / solana.LAMPORTS_PER_SOL;
    expect(balanceSecondary).toBe(0.5);
});

test('Solana Send SPL Payment', async () => {
    const walletPrimary = solana.Keypair.generate();
    const walletSecondary = solana.Keypair.generate();
    const airdropSignature = await payments.solanaNetwork.requestAirdrop(
        walletPrimary.publicKey,
        solana.LAMPORTS_PER_SOL
    );
    await sleep(1000);
    await payments.solanaNetwork.confirmTransaction(airdropSignature);
    await sleep(1000);
    const testToken = await createTestToken(walletPrimary);
    await sleep(1000);
    const mintSignature = await mintTestToken(walletPrimary, testToken.toString(), 100.00);
    await sleep(1000);
    await payments.solanaNetwork.confirmTransaction(mintSignature);
    await sleep(1000);
    const response = await payments.sendSolanaToken(walletPrimary, walletSecondary.publicKey, 50.00, testToken.toString());
    await sleep(1000);
    expect(typeof response).toBe('string');
    let mintInfo = await solanaSPL.getMint(
        payments.solanaNetwork,
        testToken
    );
    await sleep(1000);
    const tokenAccountSecondary = await solanaSPL.getOrCreateAssociatedTokenAccount(payments.solanaNetwork, walletPrimary, testToken, walletSecondary.publicKey);
    await sleep(1000);
    const balance = Number(tokenAccountSecondary.amount) / (10 ** mintInfo.decimals);
    expect(balance).toBe(50.00);
});

