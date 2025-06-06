import "@stdlib/ownable";

message AddContactMessage {
    address: Address;
}
message RemoveContactMessage {
    address: Address;
}

message SendToContactMessage {
    to: Address;
    body: Cell;
}

message BroadcastMessage {
    comment: String;
    value: Int as coins;
}

struct ContactBookStat {
    incoming: Int = 0;
    outcoming: Int = 0;
}

contract ContactBook with Ownable {
    const GasConsumption: Int = ton("0.05");
    const GasPerUser: Int = ton("0.01");

    owner: Address;
    book: map<Address, ContactBookStat>;
    length: Int as uint8;
    // Empty init() function is present by default in all Tact contracts
    // since v1.3.0, so the following may be omitted:
    //
    init(owner: Address, book: map<Address, ContactBookStat>, length: Int) {
        self.owner = owner;
        self.book = book;
        self.length = length;
    }

    receive(msg: AddContactMessage) {
        self.requireOwner();

        let deleted: Bool = self.book.del(msg.address);
        require(deleted == false, "Already in book");
        self.book.set(msg.address, ContactBookStat{});
        self.length += 1;
        self.reply("Added".asComment());
    }
    receive(msg: RemoveContactMessage) {
        self.requireOwner();

        let deleted: Bool = self.book.del(msg.address);
        require(deleted, "Not in book");
        self.length -= 1;
        self.reply("Removed".asComment());
    }

     receive(msg: SendToContactMessage) {
        self.requireOwner();

        let stat: ContactBookStat = self.book.get(msg.to)!!;
        // require(stat != null, "Not in book");
        self.forward(msg.to, msg.body, false, null);
        self.book.set(msg.to, ContactBookStat{ incoming: stat.incoming, outcoming: stat.outcoming + 1 });
    }

    receive(str: String) {
        let sender: Address = context().sender;
        let stat: ContactBookStat = self.book.get(sender)!!;
        self.forward(self.owner, str.asComment(), false, null);
        self.book.set(sender, ContactBookStat{ incoming: stat.incoming + 1, outcoming: stat.outcoming });
    }

    receive(msg: BroadcastMessage) {
        self.requireOwner();
        let val: Int = context().value;
        require(val > self.GasConsumption + (self.GasPerUser + msg.value) * self.length, "Not enough value");
        let body: Cell = msg.comment.asComment();
        foreach(key, stat in self.book) {
            send(SendParameters{
                to: key,
                value: msg.value,
                body: body,
                bounce: false
            });
            self.book.set(key, ContactBookStat{ incoming: stat.incoming, outcoming: stat.outcoming + 1});
        }
    }

    receive() {}

    get fun address_stat(addr: Address): ContactBookStat? {
        return self.book.get(addr);
    }
}
