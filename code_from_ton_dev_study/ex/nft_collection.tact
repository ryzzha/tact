import "@stdlib/ownable";
import "./nft_item";

struct CollectionData {
    nextNftItem: Int as uint256 = 0;
    content: Cell;
    owner: Address;
}

message MintNft {
    index: Int? as uint64;
    owner: Address;
    forwardAmount: Int as coins;
    content: Cell;
}

contract NftCollection with OwnableTransferable {
    nextNftItem: Int as uint64 = 0;
    owner: Address;
    content: Cell;
    nftContent: Cell;

    // Empty init() function is present by default in all Tact contracts
    // since v1.3.0, so the following may be omitted:
    //
    init(owner: Address, content: Cell, nftContent: Cell) {
        self.owner = owner;
        self.content = content;
        self.nftContent = nftContent;
    }

    receive(msg: MintNft) {
        self.requireOwner();
        let index: Int = self.nextNftItem;
        if (msg.index != null) {
            require(msg.index!! <= self.nextNftItem, "Invalid Index");
            index = msg.index!!;
        }
        let nft: StateInit = initOf NftItem(index, myAddress());
        send(SendParameters{
            to: contractAddress(nft),
            value: msg.forwardAmount,
            mode: SendPayGasSeparately,
            body: DeployNftItem{
                owner: msg.owner,
                content: msg.content
            }.toCell(),
            code: nft.code,
            data: nft.data,
            bounce: false
        });
        if (index == self.nextNftItem) {
            self.nextNftItem = self.nextNftItem + 1;
        }
    }

    get fun get_collection_data(): CollectionData {
        return CollectionData{nextNftItem: self.nextNftItem, content: self.content, owner: self.owner};
    }
    get fun get_nft_address_by_index(index: Int): Address {
        return contractAddress(initOf NftItem(index, myAddress()));
    }
    get fun get_nft_content(index: Int, individualContent: Cell): Cell {
        let b: StringBuilder = beginString();
        b.append(index.toString());
        b.append("/meta.json");
        return beginCell().storeSlice(self.nftContent.asSlice()).storeRef(b.toCell()).endCell();
        // https://s.getgems.io/nft/b/c/64427bdf371066c7ee000d99/1336/meta.json
    }
}
