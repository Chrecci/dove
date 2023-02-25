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
const NumericBoxStyle = StyleSheet.create({
    input: {
        width: 150,
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
        backgroundColor: "lime",
    },
});

function Payment({ navigation }) {
    //TODO: all this should be passed down as context ideally
    // Construct
    const [address, onChangeAddress] = useState("");
    const [amount, setAmount] = useState(0);
    const [sender, setSender] = useState(null);
    const [recipient, setRecipient] = useState(null);
    const [trigger, setTrigger] = useState(true);

    // This basically always runs looking to see if local storage still has value. If not, then resets sender state as well, so we don't have to do it manually
    // This works really well for setting a single state. Can't set two states because they both keep triggering re-renders, breaking code
    AsyncStorage.getItem('mnemonic').then(
        // AsyncStorage stores jsonified strings, so they have quotations around them. Remove quotations
        (data) => data !== null ? setSender(JSON.parse(data)) : setSender(null)
    );
    console.log("RECIPIENT: ", sender)

    async function connect() {
        const wsProvider = new WsProvider('ws://127.0.0.1:9945');
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
    async function checkSignedIn() {
        AsyncStorage.getItem('mnemonic').then(
            // AsyncStorage stores jsonified strings, so they have quotations around them. Remove quotations
            (data) => data !== null ? setSender(JSON.parse(data)) : setSender(null)
        );
        return;
    }
    
    // TODO: Swap out Alice for sender (signed in user). Address should be recipient
    // 5HgiF5r1ivVe3CzhiPsuuDVR2Pi5WifBh3mTSEPTwVuAvkKj
    // 5HgiF5r1ivVe3CzhiPsuuDVR2Pi5WifBh3mTSEPTwVuAvkKj
    async function transfer(transferAmount, transferAddress) {
        await checkSignedIn();
        console.log("SENDER: ", sender)
        const isValidMnemonic = mnemonicValidate(sender);
        console.log(transferAmount)
        console.log('Address Validity: ', transferAddress, isValidAddressPolkadotAddress(transferAddress))
        console.log('Mnemonic Validity: ', isValidMnemonic)
        if (transferAmount <= 0) {
            Toast.show("Transfer amount must be greater than 0", 5)
            return;
        }
        if (!mnemonicValidate(sender)) {
            Toast.show("You are not signed in yet! Please either create a wallet from profile page or add existing one using your mnemonic", 5)
            return;
        }
        if (!isValidAddressPolkadotAddress(transferAddress)) {
            Toast.show("Entered address does not exist", 5)
            return;
        }
        if (mnemonicValidate(sender) && isValidAddressPolkadotAddress(transferAddress)) {
            const api = await connect(); 
            const keyring = new Keyring({ type: 'sr25519' });

            // Add users to keyring. Alice is a known derivation
            const alice = keyring.addFromUri('//Alice')
            const user = keyring.addFromMnemonic(sender)

            console.log("KEYRING TRANSFER PAIRS", keyring.getPairs(), keyring.getPairs().length)
            console.log("USER ADDRESS", user["address"])
            console.log("RECIPIENT ADDRESS", transferAddress)

            // Get account balances before transaction
            const unsub = await api.query.system.account.multi([transferAddress, user["address"]], (balances) => {
                const [{ data: balance1 }, { data: balance2 }] = balances;
            
                console.log(`The balances are ${balance1.free.toHuman()} and ${balance2.free.toHuman()}`);
            });

            // Transfer to happen
            const transfer = api.tx.balances.transfer(transferAddress, transferAmount);

            // Get estimated transaction fee pre-transaction (should be 0 partial fee)
            const info = await transfer
            .paymentInfo(user);
            console.log(`
            class=${info.class.toString()},
            weight=${info.weight.toString()},
            partialFee=${info.partialFee.toHuman()}
            `);

            // Sign and send the transaction using our account
            const hash = await transfer.signAndSend(user);
            // illness gossip weapon vast cable wet write depart angry used leaf leisure
            console.log('Transfer sent with hash', hash.toHex());

            // Get estimated transaction fee pre-transaction (should be 0 partial fee)
            const unsub1 = await api.query.system.account.multi([transferAddress, user["address"]], (balances) => {
                const [{ data: balance1 }, { data: balance2 }] = balances;
            
                console.log(`The new balances are ${balance1.free.toHuman()} and ${balance2.free.toHuman()}`);
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
    const numericInput = (text) => {
        setAmount(
            text.replace(/[^0-9]/g, ''),
        );
    };

    const isValid = isValidAddressPolkadotAddress();
    const onSubmit = () => {
        return navigation.navigate('Profile')
    }
    const clearStorage = async () => {
        AsyncStorage.clear().then((res) => console.log(res));
    }
    return (
        <SafeAreaView style={{ flex: 1 , alignItems: 'center'}}>
            <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'flex-start', width: '80%', marginTop: '20%'}}>
                    <Text
                        onPress={clearStorage}
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
                    style={NumericBoxStyle.input}
                    onChangeText={numericInput}
                    value={amount}
                    placeholder="Transfer Amount"
                    keyboardType='numeric'
                    maxLength={5}
                />
                <Pressable
                    onPress={e => transfer(amount, address)}
                    style={SubmitButtonStyle.input}
                >
                    <Text>Submit Transaction</Text>
                </Pressable>
            </SafeAreaView>
        </SafeAreaView>
    );
}

export default Payment;