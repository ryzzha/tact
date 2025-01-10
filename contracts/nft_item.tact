import "@stdlib/deploy";
import "@stdlib/ownable";

message Transfer {
    query_id: Int as uint32;
    new_owner: Address;
}

struct ItemData {
    owner: Address;
    collection_address: Address;
    item_index: Int as uint32;
    induvidual_content: Cell; 
}

contract NftItem with Deployable, Ownable {
    owner: Address;
    collection_address: Address;
    item_index: Int as uint32;
    induvidual_content: String; 

    init(
        owner: Address,
        collection_address: Address,
        item_index: Int,
        induvidual_content: String 
    ) {
        self.owner = owner;
        self.collection_address = collection_address;
        self.item_index = item_index;
        self.induvidual_content = induvidual_content; 
    }

    receive(msg: Transfer) {
        self.requireOwner();
        self.owner = msg.new_owner;

    }

    get fun item_data(): ItemData {
        return ItemData{
            owner: self.owner,
            collection_address: self.collection_address,
            item_index: self.item_index,
            induvidual_content: self.induvidual_content.asSlice().asCell()
        }
    }
} 
