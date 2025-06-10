import "./messages";

const gasConsumption: Int = ton("0.03");
const minTons: Int = ton("0.015"); 

struct WalletData {
    balance: Int;
    owner: Address;
    master: Address;
    code: Cell;
}

contract JettonWallet {
    balance: Int as coins = 0;
    owner: Address;
    master: Address;
    // Empty init() function is present by default in all Tact contracts
    // since v1.3.0, so the following may be omitted:
    //
    init(owner: Address, master: Address) {
        self.owner = owner;
        self.master = master;
    }

    receive(msg: Transfer) {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "Invalid Sender");
        self.balance -= msg.amount;
        require(self.balance >= 0, "Invalid token amount");
        require(ctx.value >= 2 * ctx.readForwardFee() + gasConsumption * 2 + msg.forward_ton_amount + minTons, "Not enough value");
        let state: StateInit = initOf JettonWallet(msg.destination, self.master);
        send(SendParameters{
            to: contractAddress(state),
            value: 0,
            mode: SendRemainingValue,
            body: InternalTransfer{
                query_id: msg.query_id,
                amount: msg.amount,
                from: self.owner,
                response_destination: msg.response_destination,
                forward_ton_amount: msg.forward_ton_amount,
                forward_payload: msg.forward_payload
            }.toCell(),
            bounce: false,
            code: state.code,
            data: state.data
        });
    }

    receive(msg: InternalTransfer) {
        let ctx: Context = context();
        if (ctx.sender != self.master) {
            let state: StateInit = initOf JettonWallet(msg.from, self.master);
            require(ctx.sender == contractAddress(state), "Invalid Sender");
        }
        self.balance += msg.amount;
        let delta: Int = ctx.value - gasConsumption - (minTons - min(minTons, myBalance() - ctx.value));
        if (msg.forward_ton_amount > 0) {
            delta -= (ctx.readForwardFee() + msg.forward_ton_amount);
            send(SendParameters{
                to: self.owner,
                value: msg.forward_ton_amount,
                mode: SendPayGasSeparately,
                body: TransferNotification{
                    query_id: msg.query_id,
                    amount: msg.amount,
                    sender: msg.from,
                    forward_payload: msg.forward_payload
                }.toCell()
            });
        }
        if (delta > 0) {
            send(SendParameters{
                to: msg.response_destination,
                value: delta,
                body: Excesses{ query_id: msg.query_id }.toCell()
            });
        }
    }

    receive() {}

    bounced(src: bounced<InternalTransfer>) {
        self.balance += src.amount;
    }

    get fun get_wallet_data(): WalletData {
        return WalletData{balance: self.balance, owner: self.owner, master: self.master, code: (initOf JettonWallet(self.owner, self.master)).code};
    }
}
