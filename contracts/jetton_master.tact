import "@stdlib/deploy";
import "./jetton_wallet";
import "./messages";

contract JettonMaster with Deployable {
   owner: Address;
   totalSupply: Int as coins; 
   symbol: String = "TON";

    init() {
        self.owner = sender();
        self.totalSupply = ton("1000");
        self.mint(self.totalSupply, sender());
    }

    fun mint(amount: Int, to: Address) {
        let init: StateInit = initOf JettonWallet(myAddress(), to);
        send(SendParameters{
            to: contractAddress(init), 
            value: ton("0.05"),
            body: InternalAdd{ amount: amount, origin: myAddress() }.toCell(),
            mode: SendIgnoreErrors,
            code: init.code,
            data: init.data
        });
    }

    get fun walletAddress(owner: Address): Address{
        let init: StateInit = initOf JettonWallet(myAddress(), owner);
        return contractAddress(init);
    }

    get fun metadata(): Metadata{
        return Metadata{symbol: self.symbol, totalSupply: self.totalSupply};
    }
}
