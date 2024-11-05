import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card.tsx';
import { Button } from './ui/button.tsx';
import { Copy, ExternalLink, Send, ArrowDownUp, Plus, Eye, ChevronDown, Import } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert.tsx';
import { Input } from './ui/input.tsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog.tsx"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu.tsx"

const Web3Wallet = () => {
  
  const [isConnected, setIsConnected] = useState(false);
  const [showCopied, setShowCopied] = useState(false);
  const [showMnemonic, setShowMnemonic] = useState(false);
  const [currentAccount, setCurrentAccount] = useState(0);
  const [importedWords, setImportedWords] = useState(Array(12).fill(''));
  const [walletStep, setWalletStep] = useState('initial');
  const [accounts, setAccounts] = useState([
    { address: '0x1234...5678', balance: '1.234 ETH', name: 'Account 1', privateKey: '0xabcd...efgh' },
    { address: '0x5678...9012', balance: '0.567 ETH', name: 'Account 2', privateKey: '0xijkl...mnop' },
  ]);

  const mnemonicPhrase = [
    'wheel', 'rigid', 'panic', 'kingdom', 'ecology', 'stand',
    'virus', 'casino', 'reform', 'guess', 'paddle', 'drift'
  ];

  const handleCopyAddress = () => {
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 2000);
  };

  const handleCreateAccount = () => {
    const newAccount = {
      address: `0x${Math.random().toString(16).slice(2, 6)}...${Math.random().toString(16).slice(2, 6)}`,
      balance: '0.000 ETH',
      name: `Account ${accounts.length + 1}`,
      privateKey: `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 10)}`
    };
    setAccounts([...accounts, newAccount]);
    setCurrentAccount(accounts.length);
    setWalletStep('connected');
    setIsConnected(true);
  };

  const handleImportWallet = () => {
    if (importedWords.every(word => word.length > 0)) {
      setWalletStep('connected');
      setIsConnected(true);
    }
  };

  const AccountSelector = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between hover:bg-gray-50 transition-colors">
          <span>{accounts[currentAccount].name}</span>
          <ChevronDown size={16} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[calc(100%-2rem)] mt-1 shadow-lg" align="start">
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
            onClick={() => setWalletStep('initial')}
          >
            Back
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  const InitialView = () => (
    <Card className="text-center p-6 shadow-xl bg-white rounded-xl">
      <CardHeader>
        <CardTitle>Web3 Wallet</CardTitle>
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
              <DialogTitle className="text-xl font-bold">Create New Wallet</DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <Alert className="bg-yellow-50 border-yellow-200 shadow-sm">
                <AlertDescription className="text-yellow-800">
                  Please store your recovery phrase in a secure location. It's the only way to recover your wallet if you lose access.
                </AlertDescription>
              </Alert>
              
              <Card className="bg-gray-50 shadow-inner">
                <CardContent className="pt-6">
                  <div className="grid grid-cols-3 gap-3">
                    {mnemonicPhrase.map((word, index) => (
                      <div key={index} className="bg-white p-3 rounded-lg border shadow-sm text-center">
                        <span className="text-gray-500 text-xs">{index + 1}.</span> {word}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Button className="w-full" onClick={handleCreateAccount}>
                Create Wallet
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button 
          variant="outline" 
          className="w-full py-6 text-lg shadow-md hover:shadow-lg transition-all"
          onClick={() => setWalletStep('import')}
        >
          <Import className="mr-2" />
          Import Existing Wallet
        </Button>
      </CardContent>
    </Card>
  );

  const ConnectedView = () => (
    <>
      <Card className="shadow-md bg-white rounded-xl">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-center">
            <CardTitle className="text-xl font-bold">Account</CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              className="hover:bg-red-50 hover:text-red-600 transition-colors"
              onClick={() => {
                setIsConnected(false);
                setWalletStep('initial');
              }}
            >
              Disconnect
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <AccountSelector />
          
          <div className="bg-gray-100 p-4 rounded-xl">
            <div className="text-sm text-gray-600 font-medium">Wallet Address</div>
            <div className="flex items-center justify-between mt-1">
              <div className="font-mono">{accounts[currentAccount].address}</div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" className="hover:bg-gray-100" onClick={handleCopyAddress}>
                  <Copy size={16} />
                </Button>
                <Button variant="ghost" size="sm" className="hover:bg-gray-100">
                  <ExternalLink size={16} />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-100 p-4 rounded-xl">
            <div className="text-sm text-gray-600 font-medium">Balance</div>
            <div className="text-xl font-semibold">
              {accounts[currentAccount].balance}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="w-full shadow-sm hover:shadow transition-all">
                  <Eye size={16} className="mr-2" />
                  Private Key
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white p-6 rounded-xl shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">Private Key</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Alert className="bg-yellow-50 border-yellow-200 shadow-sm">
                    <AlertDescription className="text-yellow-800">
                      Never share your private key with anyone. Anyone with your private key has full control of your wallet.
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
              <Button variant="outline" size="sm" className="w-full shadow-sm hover:shadow transition-all">
                  <Eye size={16} className="mr-2" />
                  Recovery Phrase
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-white p-6 rounded-xl shadow-2xl">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">Recovery Phrase</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Alert className="bg-yellow-50 border-yellow-200 shadow-sm">
                    <AlertDescription className="text-yellow-800">
                      Never share your recovery phrase with anyone. Keep it in a secure location.
                    </AlertDescription>
                  </Alert>
                  <Card className="bg-gray-50 shadow-inner">
                    <CardContent className="pt-6">
                      <div className="grid grid-cols-3 gap-3">
                        {mnemonicPhrase.map((word, index) => (
                          <div key={index} className="bg-white p-3 rounded-lg border shadow-sm text-center">
                            <span className="text-gray-500 text-xs">{index + 1}.</span> {word}
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
      <Button className="py-6 shadow-md" variant="outline">
          <Send className="mr-2" /> Send
        </Button>
        <Button className="py-6 shadow-md" variant="outline">
          <ArrowDownUp className="mr-2" /> Swap
        </Button>
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full py-6 mt-4 shadow-lg hover:shadow-xl transition-all">
            <Plus className="mr-2" />
            Create New Account
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-white p-6 rounded-xl shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Create New Account</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Alert className="shadow-sm">
              <AlertDescription>
                A new account will be created under your current wallet using the same recovery phrase.
              </AlertDescription>
            </Alert>
            <Button 
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all" 
              onClick={handleCreateAccount}
            >
              Create Account
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {showCopied && (
        <Alert className="mt-4 shadow-lg">
          <AlertDescription>
            Copied to clipboard!
          </AlertDescription>
        </Alert>
      )}
    </>
  );

  return (
    <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 p-4 bg-gradient-to-br from-gray-100 to-gray-200">
      <div className="max-w-md mx-auto space-y-4">
        {walletStep === 'initial' && <InitialView />}
        {walletStep === 'import' && <ImportWallet />}
        {walletStep === 'connected' && <ConnectedView />}
      </div>
    </div>
  );
};

export default Web3Wallet;