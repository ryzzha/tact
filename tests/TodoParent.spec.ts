import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { toNano } from '@ton/core';
import { NewTodo, TodoParent } from '../wrappers/TodoParent';
import '@ton/test-utils';
import { CompleteTodo, TodoChild } from '../wrappers/TodoChild';

describe('TodoParent', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let todoParent: SandboxContract<TodoParent>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        todoParent = blockchain.openContract(await TodoParent.fromInit());

        deployer = await blockchain.treasury('deployer');

        const deployResult = await todoParent.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: todoParent.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {});

    it('should can add todo', async () => {
        const message: NewTodo = {
            $$type: 'NewTodo',
            task: "learm ton :)"
        };
        
        await todoParent.send(
            deployer.getSender(),
            {
                value: toNano("0.5")
            },
            message
        );

        const currentTodosNum = await todoParent.getNumTodos();

        expect(currentTodosNum).toEqual(1n);

        const todoChildAddr = await todoParent.getTodoAddress(currentTodosNum);

        const todoChild = blockchain.openContract(TodoChild.fromAddress(todoChildAddr));

        const firstTodoDetail = await todoChild.getDetails();

        // console.log(firstTodoDetail);

        const completeMessage: CompleteTodo = {
            $$type: 'CompleteTodo',
            seqno: 1n
        };

        await todoParent.send(
            deployer.getSender(),
            {
                value: toNano("0.5")
            },
            completeMessage
        );

        const firstTodoDetailAfter = await todoChild.getDetails();

        // console.log(firstTodoDetailAfter);
    });

    it('should can complete todo', async () => {});
});
