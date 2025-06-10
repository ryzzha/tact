import "@stdlib/ownable";
import "./messages";

const saleInitValue: Int = ton("0.1");
const saleProcessingValue: Int = ton("0.4");
const jettonTranserValue: Int = ton("0.06");
const nftTransferValue: Int = ton("0.04");

const serviceNumerator: Int = 11;
const serviceDenominator: Int = 1000;

const hundredPercent: Int = 100000000000;

const serviceAddress: Address = address("EQCXClzJ0HFilRoB0iYBWF-VGqcuSFtUVkQZ-sNjAZoN8Hfc");

@name(muldiv)
native mulDiv(a: Int, b: Int, c: Int): Int;

struct PriceInfo {
    price: Int;
    fullPrice: Int;
    royaltyFee: Int;
    royaltyDestination: Address?;
    serviceFee: Int;
    serviceAddress: Address;
}

struct SaleInfo {
    saleEnded: Bool;
    owner: Address;
    nft: Address;
    nftReceived: Bool;
    jettonWallet: Address?;
    priceInfo: PriceInfo;
}

contract NftSale with Ownable {
    owner: Address;
    nft: Address;
    nftReceived: Bool = false;
    jettonWallet: Address? = null;
    numerator: Int as uint16;
    denominator: Int as uint16;
    royaltyDestination: Address?;
    saleEnded: Bool = true;
    price: Int as coins;
    _id: Int as uint64;

    init(id: Int, owner: Address, nft: Address, price: Int, numerator: Int, denominator: Int, royaltyDestination: Address?) {
        self.owner = owner;
        self.nft = nft;
        self.price = price;
        self.royaltyDestination = royaltyDestination;
        self.numerator = numerator;
        self.denominator = denominator;
        self._id = id;
        if (self.royaltyDestination == null || denominator == 0) {
            self.numerator = 0;
            self.denominator = 1;
            self.royaltyDestination = null;
        }
    }
    receive(msg: SetWalletAddress) {
        let ctx: Context = context();
        require(ctx.sender == self.owner, "Invalid sender");
        require(self.jettonWallet == null, "Already set");
        self.jettonWallet = msg.walletAddress;
    }
    receive(msg: NftOwnershipAssigned) {
        let ctx: Context = context();
        if(ctx.sender != self.nft || self.jettonWallet == null) {
            send(SendParameters{
                to: ctx.sender,
                value: 0,
                mode: SendRemainingValue,
                body: NftTransfer{queryId: msg.queryId, newOwner: msg.prev_owner, responseDestination: msg.prev_owner, customPayload: null, forwardAmount: 1, forwardPayload: "Error occured".asComment()}.toCell()
            });
        }
        else {
            self.saleEnded = false;
            self.nftReceived = true;
            send(SendParameters{
                to: msg.prev_owner,
                value: 0,
                mode: SendRemainingValue,
                body: "Nft Received".asComment()
            });
        }
    }
    receive(msg: ServiceMessage) {
        require(sender() == serviceAddress, "Invalid sender");
        require(self.saleEnded, "Not ended");
        nativeSendMessage(msg.body, msg.mode);
    }
//        (state_init)
// sellet -> nft -> marketplace(deployer) -> sell_contract
//                                -> nft -> sell_contract

// 1.1% = (11 / 1000) = 0

// fixed point

// 1000000000

// (100_000000000 * (11 * 100% / 1000) / 100%) = 100_000000000 * (11 / 1000) = 100_000000000 * 1.1%
// 100_000000000 * (1100000000000 / 1000) / 100000000000 = 1100000000000 / 1000 * 100_000000000 / 100000000000 =
// == 1100000000 * 100_000000000 / 100000000000 = 110000000000000000000 / 100000000000 = 1100000000

    receive(msg: TransferNotification) {
        let ctx: Context = context();
        let sale_fee: Int = mulDiv(self.price, mulDiv(serviceNumerator, hundredPercent, serviceDenominator), hundredPercent);
        let royaltyFee: Int = mulDiv(self.price, mulDiv(self.numerator, hundredPercent, self.denominator), hundredPercent);
        let fullPrice: Int = self.price + sale_fee + royaltyFee;
        if(ctx.sender != self.jettonWallet || self.nftReceived == false || self.saleEnded || ctx.value < saleProcessingValue || msg.amount < fullPrice) {
            self.send_jetton(ctx.sender, 0, SendRemainingValue, msg.queryId, msg.amount, msg.sender, msg.sender, "Error occured".asComment());
            return;
        }
        if(msg.amount > fullPrice) {
            self.send_jetton(ctx.sender, jettonTranserValue, 0, msg.queryId, msg.amount - fullPrice, msg.sender, msg.sender, "return".asComment());
            ctx.value = ctx.value - jettonTranserValue;
        }
        self.send_jetton(ctx.sender, jettonTranserValue, 0, msg.queryId, sale_fee, serviceAddress, msg.sender, emptyCell());
        ctx.value = ctx.value - jettonTranserValue;
        if(self.royaltyDestination != null) {
            self.send_jetton(ctx.sender, jettonTranserValue, 0, msg.queryId, royaltyFee, self.royaltyDestination!!, msg.sender, "Error occured".asComment());
            ctx.value = ctx.value - jettonTranserValue;
        }
        send(SendParameters{
            to: self.nft,
            value: ctx.value,
            body: NftTransfer{ queryId: msg.queryId, newOwner: msg.sender, responseDestination: msg.sender, customPayload: null, forwardAmount: 1, forwardPayload: "Nft received".asComment() }.toCell()
        });
        self.nftReceived = false;
        self.saleEnded = true;
        self.send_jetton(ctx.sender, 0, SendRemainingBalance, msg.queryId, self.price, self.owner, msg.sender, emptyCell());
    }

    receive("Cancel") {
        self.requireOwner();
        send(SendParameters{
            to: self.nft,
            value: 0,
            mode: SendRemainingBalance,
            body: NftTransfer{queryId: now(), newOwner: self.owner, responseDestination: self.owner, customPayload: null, forwardAmount: 1, forwardPayload:  "Nft received".asComment() }.toCell()
        });
        self.nftReceived = false;
        self.saleEnded = true;
    }

    fun send_jetton(to: Address, value: Int, mode: Int, queryId: Int, amount: Int, destination: Address, responseDestination: Address, payload: Cell) {
        if (amount > 0) {
            send(SendParameters{
                to: to,
                value: value,
                mode: mode,
                body: Transfer{queryId: queryId, amount: amount, destination: destination, responseDestination: responseDestination, customPayload: null, forwardTonAmount: 1, forwardPayload: payload}.toCell()
            });
        }
    }

    get fun get_priceInfo(): PriceInfo {
        let serviceFee: Int = mulDiv(self.price, mulDiv(serviceNumerator, hundredPercent, serviceDenominator), hundredPercent);
        let royaltyFee: Int = mulDiv(self.price, mulDiv(self.numerator, hundredPercent, self.denominator), hundredPercent);
        let fullPrice: Int = self.price + serviceFee + royaltyFee;
        return PriceInfo{price: self.price, fullPrice: fullPrice, royaltyFee: royaltyFee, royaltyDestination: self.royaltyDestination, serviceFee: serviceFee, serviceAddress: serviceAddress};
    }
    get fun get_sale_info(): SaleInfo {
        let serviceFee: Int = mulDiv(self.price, mulDiv(serviceNumerator, hundredPercent, serviceDenominator), hundredPercent);
        let royaltyFee: Int = mulDiv(self.price, mulDiv(self.numerator, hundredPercent, self.denominator), hundredPercent);
        let fullPrice: Int = self.price + serviceFee + royaltyFee;
        return SaleInfo { saleEnded: self.saleEnded, owner: self.owner, nft: self.nft, nftReceived: self.nftReceived, jettonWallet: self.jettonWallet, priceInfo:
                            PriceInfo{price: self.price, fullPrice: fullPrice, royaltyFee: royaltyFee, royaltyDestination: self.royaltyDestination, serviceFee: serviceFee, serviceAddress: serviceAddress}};
    }
}