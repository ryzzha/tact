import { CompilerConfig } from '@ton/blueprint';

export const compile: CompilerConfig = {
    lang: 'tact',
    target: 'contracts/dispatcher.tact',
    options: {
        debug: true,
    },
};
