import React from 'react';
import { View, Text } from 'react-native';
import { ApiPromise, WsProvider } from '@polkadot/api';
// import keyring from '@polkadot/ui-keyring';
import { Keyring } from '@polkadot/keyring';
import {
    mnemonicGenerate,
    mnemonicToMiniSecret,
    mnemonicValidate,
    ed25519PairFromSecret
  } from '@polkadot/util-crypto';
var { encodeAddress } = require('@polkadot/util-crypto')
import { isTestChain } from '@polkadot/util'


function Payment({ navigation }) {
    // Construct
    const wsProvider = new WsProvider('ws://127.0.0.1:9945');

    async function connect() {
        const keyring = new Keyring({ type: 'sr25519' });

        const api = await ApiPromise.create({ provider: wsProvider });
        // Confirm genesis hash
        console.log(api.genesisHash.toHex());
        

        // Retrieve the latest header
        const lastHeader = await api.rpc.chain.getHeader();

        // Log the information
        console.log(`${chain}: last block #${lastHeader.number} has hash ${lastHeader.hash}`);

        // Retrieve the chain name and info
        const [chain, nodeName, nodeVersion] = await Promise.all([
            api.rpc.system.chain(),
            api.rpc.system.name(),
            api.rpc.system.version()
        ]);
        console.log(
            `You are connected to chain ${chain} using ${nodeName} v${nodeVersion}`
        );

        const createAccount = (mnemonic) => {
            mnemonic = mnemonic && mnemonicValidate(mnemonic) 
                 ? mnemonic 
                 : mnemonicGenerate();
            const account = keyring.addFromUri(mnemonic);
            return { account, mnemonic };
        }
        createAccount(); 
        // add existing accounts to keyring through hard derivations https://polkadot.js.org/docs/keyring/start/suri
        const rando = keyring.addFromUri('//5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY')
        const rando1 = keyring.addFromUri('//5DAAnrj7VHTznn2AWBemMuyBwZWs6FNFjdyVXUeYum3PTXFy')
        const rando2 = keyring.addFromUri('//5GsYgNoJasVspbqftfmPRtcGqZ8UDnmwhu8HeAEkd2LhcV8S')
        console.log(keyring.getPairs(), keyring.getPairs().length)

        // Adjust how many accounts to query at once.
        let limit = 50;
        let result = [];
        let last_key = "";
    
        while (true) {
            let query = await api.query.system.account.entriesPaged({ args: [], pageSize: limit, startKey: last_key });
            console.log("LENGTH", query.length)
            if (query.length == 0) {
                break
            }
    
            for (const user of query) {
                let account_id = encodeAddress(user[0].slice(-32));
                let free_balance = user[1].data.free.toString();
                let reserved_balance = user[1].data.reserved.toString();
                result.push({ account_id, free_balance, reserved_balance });
                last_key = user[0];
            }
        }
    
        console.log(result)

        
        }
    connect();
     
    return (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text
                onPress={() => navigation.navigate('Profile')}
                style={{ fontSize: 26, fontWeight: 'bold' }}>Go to Profile</Text>
        </View>
    );
}

export default Payment;