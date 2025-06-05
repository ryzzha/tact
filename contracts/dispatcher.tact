import "@stdlib/deploy";
import "@stdlib/ownable";

message SubstractMessage {
    a: Int;
    b: Int;
}

message MultiplyMessage {
    a: Int;
    b: Int;
}

message NegateMessage {
    num: Int;
}

message ResultMessage {
    res: Int;
}

struct DispatcherInfo {
    name: String;
    operation_amount: Int;
    owner: Address;
}

message ProxyMessage {
    to: Address;
    body: String;
}

trait MaxBox {
    operation_amount: Int;

    get fun sub(a: Int, b: Int): Int {
        return a -  b;
    }

    receive(msg: SubstractMessage) {
        send(SendParameters{
            to: sender(), 
            value: 0, 
            mode: SendRemainingValue, 
            body: ResultMessage{ res: self.sub(msg.a, msg.b) }.toCell()
        });
        self.operation_amount += 1;
    }

    receive(msg: MultiplyMessage) {
        self.reply(ResultMessage{ res: msg.a * msg.b }.toCell());
        self.operation_amount += 1;
    }

    receive(msg: NegateMessage) {
        self.reply(ResultMessage{ res: -msg.num }.toCell());
        self.operation_amount += 1;
    }
}

contract Dispatcher with Deployable, Ownable, MaxBox {
    owner: Address;
    operation_amount: Int;
    
    init(owner: Address) {
        self.owner = owner;
        self.operation_amount = 0;
    }

    get fun info(): Cell {
        return DispatcherInfo{owner: self.owner, name: "Dispatcher", operation_amount: self.operation_amount}.toCell();
    }

    receive(msg: ProxyMessage) { 
        self.requireOwner();
        send(SendParameters{
            to: msg.to,
            value: 0,
            mode: SendRemainingValue,
            body: msg.body.asComment()
        });
    }

    receive() {}

    get fun name(): String {
        return "Dispatcher";
    }
}
