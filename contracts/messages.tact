message NewTodo {
    task: String;
}

message InternalSetTask {
    task: String;
} 

message NewTodyResponse {
    seqno: Int as uint256;
}

message CompleteTodo {
    seqno: Int as uint256;
}

message InternalCompleteTask {
     excess: Address;
}

message InternalAdd {
    amount: Int as coins;
    origin: Address;
}

message Transfer {
    amount: Int as coins;
    to: Address;
}