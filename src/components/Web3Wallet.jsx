import React, { useEffect, useState } from "react";
import { generateMnemonic, mnemonicToSeedSync } from "bip39";
import { derivePath } from "ed25519-hd-key";
import {
  Keypair,
  Connection,
  PublicKey,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { Buffer } from "buffer";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "./ui/card.tsx";
import { Button } from "./ui/button.tsx";
import {
  Copy,
  ExternalLink,
  Send,
  ArrowLeft,
  ArrowDownUp,
  CheckCircle,
  XCircle,
  Plus,
  Eye,
  ChevronDown,
  Import,
} from "lucide-react";
import { Alert, AlertDescription } from "./ui/alert.tsx";
import { Input } from "./ui/input.tsx";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog.tsx";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu.tsx";

window.Buffer = Buffer;

const Web3Wallet = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [mnemonic, setMnemonic] = useState(
    "champion capital butter volume protect cave mail behind because divert have chronic"
  );
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentAccount, setCurrentAccount] = useState(0);
  const [activeAccountBalance, setActiveAccountBalance] = useState(0);
  const [importedWords, setImportedWords] = useState(Array(12).fill(""));
  const [walletStep, setWalletStep] = useState("initial");
  const [accounts, setAccounts] = useState([]);

  const [recipientAddress, setRecipientAddress] = useState("");
  const [amount, setAmount] = useState(1);
  const [txStatus, setTxStatus] = useState("");

  const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

  useEffect(() => {
    createMnemonic();
  }, []);

  useEffect(() => {
    const seed = mnemonicToSeedSync(mnemonic);
    const path = `m/44'/501'/${currentAccount}'/0'`;
    const derivedSeed = derivePath(path, seed.toString("hex")).key;
    const secret = nacl.sign.keyPair.fromSeed(derivedSeed).secretKey;
    const keypair = Keypair.fromSecretKey(secret);
    const publicKey = keypair._keypair.publicKey;
    const formattedAddress = bs58.encode(publicKey);

    getSolanaBalance(formattedAddress).then((balance) => {
      setActiveAccountBalance(balance);
    });
  }, [currentAccount, walletStep]);

  const createMnemonic = async () => {
    const mn = await generateMnemonic();
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(accounts[currentAccount].address);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const getSolanaBalance = async (publicKey) => {
    try {
      const publicKeyObj = new PublicKey(publicKey);
      const balance = await connection.getBalance(publicKeyObj);
      return balance / LAMPORTS_PER_SOL;
    } catch (error) {
      console.error("Error in getting balance: ", error);
      throw error;
    }
  };

  const handleCreateAccount = async () => {
    let mnemonicPhrase = "";

    if (importedWords.every((word) => word.length > 0)) {
      mnemonicPhrase = importedWords.join(" ");
    } else {
      mnemonicPhrase = mnemonic;
    }

    const seed = mnemonicToSeedSync(mnemonicPhrase);
    const path = `m/44'/501'/${currentIndex}'/0'`;
    const derivedSeed = derivePath(path, seed.toString("hex")).key;
    const secret = nacl.sign.keyPair.fromSeed(derivedSeed).secretKey;
    const keypair = Keypair.fromSecretKey(secret)._keypair;
    setCurrentIndex(currentIndex + 1);

    const getUserBalance = await getSolanaBalance(
      bs58.encode(keypair.publicKey)
    );

    const newAccount = {
      address: bs58.encode(keypair.publicKey),
      balance: getUserBalance,
      name: `Account ${accounts.length + 1}`,
      privateKey: bs58.encode(keypair.secretKey),
    };

    setAccounts([...accounts, newAccount]);
    setCurrentAccount(accounts.length);
    setActiveAccountBalance(getUserBalance);
    setWalletStep("connected");
    setIsConnected(true);
  };

  const handleSignTransaction = async () => {
    try {
      console.log("Sending transaction...");
      const seed = mnemonicToSeedSync(mnemonic);
      const path = `m/44'/501'/${currentAccount}'/0'`;
      const derivedSeed = derivePath(path, seed.toString("hex")).key;
      const secret = nacl.sign.keyPair.fromSeed(derivedSeed).secretKey;
      const keypair = Keypair.fromSecretKey(secret);

      const fromPublicKey = keypair.publicKey;

      // Get recipient public key
      const toPublicKey = new PublicKey(recipientAddress);

      const transferInstruction = SystemProgram.transfer({
        fromPubkey: fromPublicKey,
        toPubkey: toPublicKey,
        lamports: amount * 1000000000, // Convert SOL to lamports
      });

      // Create transaction and add the transfer instruction
      const transaction = new Transaction().add(transferInstruction);

      const result = await sendAndConfirmTransaction(connection, transaction, [
        keypair,
      ]);
      setTxStatus("success");
      console.log("Transaction confirmed:", result);

      return {
        success: true,
      };
    } catch (error) {
      setTxStatus("error");
      return {
        success: false,
        error: error.message,
      };
    }
  };

  const handleImportWallet = async () => {
    if (importedWords.every((word) => word.length > 0)) {
      setMnemonic(importedWords.join(" "));
    }
    handleCreateAccount();
  };

  const AccountSelector = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className="w-full justify-between hover:bg-gray-50 transition-colors"
        >
          <span>{accounts[currentAccount].name}</span>
          <ChevronDown size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[calc(100%-2rem)] mt-1 shadow-lg"
        align="start"
      >
        {accounts.map((account, index) => (
          <DropdownMenuItem
            key={index}
            onClick={() => setCurrentAccount(index)}
            className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer"
          >
            <div className="flex flex-col">
              <span className="font-medium">{account.name}</span>
              <span className="text-sm text-gray-500">{account.balance}</span>
            </div>
            {currentAccount === index && (
              <div className="w-2 h-2 bg-green-500 rounded-full" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const ImportWallet = () => (
    <Card className="text-center p-6 shadow-xl bg-white rounded-xl">
      <CardHeader>
        <CardTitle className="text-2xl font-bold">Import Wallet</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <Alert className="bg-yellow-50 border-yellow-200 shadow-sm">
          <AlertDescription className="text-yellow-800">
            Enter your 12-word recovery phrase to import your wallet.
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-3 gap-3">
          {importedWords.map((word, index) => (
            <div key={index} className="relative">
              <span className="absolute text-xs text-gray-500 left-3 top-1">
                {index + 1}
              </span>
              <Input
                className="pl-7 text-sm shadow-sm hover:shadow transition-shadow"
                value={word}
                onChange={(e) => {
                  const newWords = [...importedWords];
                  newWords[index] = e.target.value;
                  setImportedWords(newWords);
                }}
                placeholder={`Word ${index + 1}`}
              />
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <Button
            className="w-full"
            onClick={handleImportWallet}
            disabled={!importedWords.every((word) => word.length > 0)}
          >
            Import Wallet
          </Button>
          <Button
            variant="outline"
            className="w-full shadow-sm hover:shadow transition-all"
            onClick={() => setWalletStep("initial")}
          >
            Back
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const InitialView = () => {
    const mnemonicArray = mnemonic.split(" ");

    return (
      <Card className="text-center p-6 shadow-xl bg-white rounded-xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            Welcome to Web3 Wallet
          </CardTitle>
          <CardDescription className="text-gray-400 font-semibold">
            Get started with your digital wallet
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Dialog>
            <DialogTrigger asChild>
              <Button className="w-full py-6 text-lg">
                <Plus className="mr-2" />
                Create New Wallet
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-white p-6 rounded-xl shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-xl font-bold">
                  Create New Wallet
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <Alert className="bg-yellow-50 border-yellow-200 shadow-sm">
                  <AlertDescription className="text-yellow-800">
                    Please store your recovery phrase in a secure location. It's
                    the only way to recover your wallet if you lose access.
                  </AlertDescription>
                </Alert>

                <Card className="bg-gray-50 shadow-inner">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-3 gap-3">
                      {mnemonicArray.map((word, index) => (
                        <div
                          key={index}
                          className="bg-white p-3 rounded-lg border shadow-sm text-center"
                        >
                          <span className="text-gray-500 text-xs">
                            {index + 1}.
                          </span>{" "}
                          {word}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <CardDescription className="text-sm text-red-500 font-medium">
                  * An existing Mnemonic Phrase was employed to restore a funded
                  wallet for interaction purposes.
                </CardDescription>

                <Button className="w-full" onClick={handleCreateAccount}>
                  Create Wallet
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Button
            variant="outline"
            className="w-full py-6 text-lg shadow-md hover:shadow-lg transition-all"
            onClick={() => setWalletStep("import")}
          >
            <Import className="mr-2" />
            Import Existing Wallet
          </Button>
        </CardContent>
      </Card>
    );
  };

  const ConnectedView = () => {
    const mnemonicArray = mnemonic.split(" ");

    return (
      <>
        <Card className="shadow-md bg-white rounded-xl">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <CardTitle className="text-xl font-bold">
                Solana <span className="text-xs"> ( devnet ) </span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="hover:bg-red-50 hover:text-red-600 transition-colors"
                onClick={() => {
                  setIsConnected(false);
                  setWalletStep("initial");
                  setCurrentAccount(0);
                  setCurrentIndex(0);
                  setAccounts([]);
                  setImportedWords(Array(12).fill(""));
                  setMnemonic(
                    "champion capital butter volume protect cave mail behind because divert have chronic"
                  );
                }}
              >
                Disconnect
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <AccountSelector />

            <div className="bg-gray-100 p-4 rounded-xl">
              <div className="text-sm text-gray-600 font-medium">
                Wallet Address
              </div>
              <div className="flex items-center justify-between mt-1">
                <div className="font-mono">
                  {`${accounts[currentAccount].address.slice(
                    0,
                    4
                  )}...${accounts[currentAccount].address.slice(-4)}`}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-gray-100"
                    onClick={handleCopyAddress}
                  >
                    <Copy size={16} />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="hover:bg-gray-100"
                  >
                    <a
                      target="_blank"
                      href={`https://explorer.solana.com/address/${accounts[currentAccount].address}?cluster=devnet`}
                    >
                      <ExternalLink size={16} />
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-gray-100 p-4 rounded-xl">
              <div className="text-sm text-gray-600 font-medium">Balance</div>
              <div className="text-xl font-semibold">
                {`${activeAccountBalance} SOL`}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full shadow-sm hover:shadow transition-all"
                  >
                    <Eye size={16} className="mr-2" />
                    Private Key
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white p-6 rounded-xl shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">
                      Private Key
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Alert className="bg-yellow-50 border-yellow-200 shadow-sm">
                      <AlertDescription className="text-yellow-800">
                        Never share your private key with anyone. Anyone with
                        your private key has full control of your wallet.
                      </AlertDescription>
                    </Alert>
                    <div className="bg-gray-50 p-4 rounded-xl shadow-inner font-mono break-all">
                      {accounts[currentAccount].privateKey}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full shadow-sm hover:shadow transition-all"
                  >
                    <Eye size={16} className="mr-2" />
                    Recovery Phrase
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-white p-6 rounded-xl shadow-2xl">
                  <DialogHeader>
                    <DialogTitle className="text-xl font-bold">
                      Recovery Phrase
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <Alert className="bg-yellow-50 border-yellow-200 shadow-sm">
                      <AlertDescription className="text-yellow-800">
                        Never share your recovery phrase with anyone. Keep it in
                        a secure location.
                      </AlertDescription>
                    </Alert>
                    <Card className="bg-gray-50 shadow-inner">
                      <CardContent className="pt-6">
                        <div className="grid grid-cols-3 gap-3">
                          {mnemonicArray.map((word, index) => (
                            <div
                              key={index}
                              className="bg-white p-3 rounded-lg border shadow-sm text-center"
                            >
                              <span className="text-gray-500 text-xs">
                                {index + 1}.
                              </span>{" "}
                              {word}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-4 mt-4">
          <Button
            onClick={() => setWalletStep("transacting")}
            className="py-6 shadow-md"
            variant="outline"
          >
            <Send className="mr-2" /> Send
          </Button>
          <Button className="py-6 shadow-md" variant="outline">
            <ArrowDownUp className="mr-2" /> Swap
          </Button>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full py-6 mt-4 shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="mr-2" />
              Create New Account
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white p-6 rounded-xl shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">
                Create New Account
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Alert className="shadow-sm">
                <AlertDescription>
                  A new account will be created under your current wallet using
                  the same recovery phrase.
                </AlertDescription>
              </Alert>
              <Button
                className="w-full bg-gradient-to-r text-white shadow-lg hover:shadow-xl transition-all"
                onClick={handleCreateAccount}
              >
                Create Account
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {showCopied && (
          <Alert className="mt-4 shadow-lg">
            <AlertDescription>Copied to clipboard!</AlertDescription>
          </Alert>
        )}
      </>
    );
  };

  const TransactionView = ({ onBack, senderAddress }) => {
    // Assuming txStatus is one of: null, "success", "error"

    return (
      <>
        <Card className="shadow-md bg-white rounded-xl">
          <CardHeader className="pb-2">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  className="hover:bg-gray-100"
                >
                  <ArrowLeft size={16} className="mr-1" />
                  Back
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardTitle className="text-xl font-bold text-center mt-2 mb-3">
            Send SOL
          </CardTitle>
          <CardContent className="space-y-6">
            {/* Show status alert if there's a status */}
            {txStatus && (
              <Alert
                className={`${
                  txStatus === "success"
                    ? "bg-green-50 border-green-200"
                    : "bg-red-50 border-red-200"
                }`}
              >
                <AlertDescription
                  className={`flex items-center gap-2 ${
                    txStatus === "success" ? "text-green-800" : "text-red-800"
                  }`}
                >
                  {txStatus === "success" ? (
                    <>
                      <CheckCircle size={16} />
                      Transaction successful
                    </>
                  ) : (
                    <>
                      <XCircle size={16} />
                      Transaction failed
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-gray-600 font-medium">
                  From
                </label>
                <div className="bg-gray-100 p-3 rounded-lg font-mono text-sm">
                  {senderAddress}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-600 font-medium">To</label>
                <Input
                  placeholder="Enter recipient address"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  className="font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm text-gray-600 font-medium">
                  Amount (SOL)
                </label>
                <div className="relative">
                  <Input
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pr-12"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
                    SOL
                  </div>
                </div>
              </div>
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <AlertDescription className="text-blue-800">
                Estimated network fee: 0.000005 SOL
              </AlertDescription>
            </Alert>

            <Button
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all"
              onClick={handleSignTransaction}
              disabled={!recipientAddress || !amount}
            >
              Sign Transaction
            </Button>
          </CardContent>
        </Card>
      </>
    );
  };

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 p-4 bg-gradient-to-br from-gray-100 to-gray-200">
      <div className="max-w-md mx-auto space-y-4">
        {walletStep === "initial" && <InitialView />}
        {walletStep === "import" && <ImportWallet />}
        {walletStep === "connected" && <ConnectedView />}
        {walletStep === "transacting" && (
          <TransactionView
            onBack={() => {
              setWalletStep("connected");
              setTxStatus("");
            }}
            senderAddress={accounts[currentAccount].address}
          />
        )}
      </div>
    </div>
  );
};

export default Web3Wallet;
