import "@stdlib/deploy";
import "@stdlib/ownable";
import "./todo_child";
import "./messages";

contract TodoParent with Deployable, Ownable {
    owner: Address;
    numTodos: Int as uint256 = 0;

    init() {
        self.owner = sender();
    }

    receive(msg: NewTodo) {
        self.numTodos = self.numTodos + 1;
        let init: StateInit = initOf TodoChild(myAddress(), self.numTodos);

        send(SendParameters{
            to: contractAddress(init), 
            value: ton("0.2"),
            body: InternalSetTask{ task: msg.task }.toCell(),
            mode: SendIgnoreErrors,
            code: init.code,
            data: init.data,
        });

        self.reply(NewTodyResponse{ seqno: self.numTodos }.toCell());
    }

    receive(msg: CompleteTodo) {
        require(msg.seqno <= self.numTodos, "Todo does not exist");

        send(SendParameters{
            to: contractAddress(initOf TodoChild(myAddress(), msg.seqno)),
            value: 0,
            mode: SendRemainingValue + SendIgnoreErrors,
            body: InternalCompleteTask{excess: sender()}.toCell(),
        })
    }

    get fun numTodos(): Int {
        return self.numTodos;
    }

    get fun todoAddress(seqno: Int): Address{
        return contractAddress(initOf TodoChild(myAddress(), seqno));
    }
}
