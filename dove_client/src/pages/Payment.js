import React, { useState, useEffect } from 'react';
import { View, Text, SafeAreaView, Pressable, Button, StyleSheet, TextInput, Alert } from 'react-native';
import { ApiPromise, WsProvider } from '@polkadot/api';
// import keyring from '@polkadot/ui-keyring';
import { Keyring } from '@polkadot/keyring';
import {
    mnemonicGenerate,
    mnemonicToMiniSecret,
    mnemonicValidate,
    ed25519PairFromSecret
  } from '@polkadot/util-crypto';
// var { encodeAddress } = require('@polkadot/util-crypto')
import { isTestChain } from '@polkadot/util'
import { set } from 'react-native-reanimated';
const { decodeAddress, encodeAddress } = require('@polkadot/keyring');
const { hexToU8a, isHex } = require('@polkadot/util');
import AsyncStorage from '@react-native-async-storage/async-storage';

// https://www.npmjs.com/package/react-native-simple-toast 
import Toast from 'react-native-simple-toast';

const TextBoxStyle = StyleSheet.create({
    input: {
        width: 200,
        height: 40,
        margin: 12,
        borderWidth: 1,
        padding: 10,
    },
});

const SubmitButtonStyle = StyleSheet.create({
    input: {
        height: 40,
        margin: 12,
        borderWidth: 1,
        padding: 10,
        backgroundColor: "green",
    },
});

function Payment({ navigation }) {
    //TODO: all this should be passed down as context ideally
    // Construct
    const [address, onChangeAddress] = useState("");
    const [amount, onChangeAmount] = useState(null);
    const [sender, setSender] = useState(null);
    const [recipient, setRecipient] = useState(null);


    const wsProvider = new WsProvider('ws://127.0.0.1:9945');

    AsyncStorage.getItem('mnemonic').then(
        // AsyncStorage stores jsonified strings, so they have quotations around them. Remove quotations
        (data) => data !== null ? setRecipient(data.slice(1, -1)) : console.log("nonexistent recipient")
    );
    console.log("RECIPIENT: ", recipient)
    async function connect() {
        const api = await ApiPromise.create({ provider: wsProvider });
        const chainInfo = await api.registry.getChainProperties()

        console.log(chainInfo);
        console.log("Native Token Name:", api.registry.chainTokens[0], "Plancks per Token: 10^", api.registry.chainDecimals[0])
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
        return api
    }
    
    async function transfer() {
        if (recipient) {
            const api = await connect(); 
            const keyring = new Keyring({ type: 'sr25519' });
            const alice = keyring.addFromUri('//Alice')
            // const createAccount = (mnemonic) => {
            //     mnemonic = mnemonic && mnemonicValidate(mnemonic) 
            //          ? mnemonic 
            //          : mnemonicGenerate();
            //     const account = keyring.addFromUri(mnemonic, "supersecurepassword");
            //     return { account, mnemonic };
            // }
            // console.log("CREAITING ACCOUNT", createAccount()); 
            const test_user = keyring.addFromMnemonic('illness gossip weapon vast cable wet write depart angry used leaf leisure')
            const test_user1 = keyring.addFromMnemonic('walk cupboard parrot combine arena inquiry stereo talk sense maple action neutral')
            
            const user = keyring.addFromMnemonic(recipient)
            console.log("TEST TRANSFER PAIRS", keyring.getPairs(), keyring.getPairs().length)
            console.log("TEST USER ADDRESSES", test_user["address"], test_user1["address"])
            const unsub = await api.query.system.account.multi(['5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', test_user["address"], test_user1["address"]], (balances) => {
                const [{ data: balance1 }, { data: balance2 }, { data: balance3 }] = balances;
            
                console.log(`The balances are ${balance1.free.toHuman()} and ${balance2.free.toHuman()} and ${balance3.free.toHuman()}`);
            });
            const transfer = api.tx.balances.transfer(user["address"], 12345);
            const info = await api.tx.balances
            .transfer(test_user1["address"], 1001)
            .paymentInfo(test_user);

            // log relevant info, partialFee is Balance, estimated for current
            console.log(`
            class=${info.class.toString()},
            weight=${info.weight.toString()},
            partialFee=${info.partialFee.toHuman()}
            `);
            // Sign and send the transaction using our account
            // const hash = await transfer.signAndSend(alice);
            
            // console.log('Transfer sent with hash', hash.toHex());
            const unsub1 = await api.query.system.account.multi(['5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', test_user["address"], test_user1["address"], user["address"]], (balances) => {
                const [{ data: balance1 }, { data: balance2 }, { data: balance3 }, { data: balance4 }] = balances;
            
                console.log(`The new balances are ${balance1.free.toHuman()} and ${balance2.free.toHuman()} and ${balance3.free.toHuman()} and ${balance4.free.toHuman()}`);
            });
            
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
        
            console.log(" RESULTS", result)
        } else {
            Toast.show("You are not signed in yet! Please either create a wallet from profile page or add existing one using your mnemonic", 5)
        }
        

    }
    

    const isValidAddressPolkadotAddress = (address) => {
        try {
            encodeAddress(
            isHex(address)
                ? hexToU8a(address)
                : decodeAddress(address)
            );

            return true;
        } catch (error) {
            return false;
        }
    };

    const isValid = isValidAddressPolkadotAddress();
    const onSubmit = () => {
        return navigation.navigate('Profile')
    }
    return (
        <SafeAreaView style={{ flex: 1 , alignItems: 'center'}}>
            <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-start', width: '80%', marginTop: '20%'}}>
                    <Text
                        style={{ fontSize: 26, fontWeight: 'bold' }}>Payment Page
                    </Text>
            </SafeAreaView>  
            <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-start' }}>
                <TextInput
                    style={TextBoxStyle.input}
                    onChangeText={onChangeAddress}
                    value={address}
                    placeholder="Enter Recipient Address Here"
                />
                <TextInput
                    style={TextBoxStyle.input}
                    onChangeText={onChangeAmount}
                    value={amount}
                    placeholder="Amount of Tokens"
                    keyboardType="numeric"
                />
                <Pressable
                    onPress={transfer}
                    style={SubmitButtonStyle.input}
                >
                    <Text>Submit Transaction</Text>
                </Pressable>
            </SafeAreaView>
        </SafeAreaView>
    );
}

export default Payment;