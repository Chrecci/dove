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
import AsyncStorage from '@react-native-async-storage/async-storage';
import Toast from 'react-native-simple-toast';
const { decodeAddress, encodeAddress } = require('@polkadot/keyring');
const { hexToU8a, isHex } = require('@polkadot/util');

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

function Profile({ navigation }) {
    const [mnemonic, setMnemonic] = useState("");
    const [accountInfo, setAccountInfo] = useState({});
    const [password, onChangePassword] = useState("");
    const [mnemonicInput, onChangeMnemonicInput] = useState("");

    // a dummy state that can be set and changed to trigger useEffect as a dependency
    const [trigger, setTrigger] = useState(true);
    
    useEffect(() => {
        console.log(mnemonic, accountInfo)
        AsyncStorage.getItem('mnemonic').then(
            // AsyncStorage stores jsonified strings, so they have quotations around them. Remove quotations
            (data) => {
                if (JSON.parse(data) !== null) {
                    setMnemonic(JSON.parse(data))
                    console.log("SET MNEMONIC: ", mnemonic)
                } else {
                    console.log("something went wrong mnemonic")
                }
            }
        );
        AsyncStorage.getItem('accountInfo').then(
            // AsyncStorage stores jsonified strings, so they have quotations around them. Remove quotations
            (data) => {
                if (JSON.parse(data) !== accountInfo) {
                    if (JSON.parse(data) !== null && JSON.parse(data) !== {}) {
                        setAccountInfo(JSON.parse(data))
                        console.log("SET ACCOUNT INFO: ", accountInfo)
                        console.log(mnemonic)
                    } else {
                        console.log("something went wrong")
                    }
                }
            }
        );
       }, [trigger])

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
    // function to asynchronously store value into local device storage
    const storeMnemonic = async (value) => {
        try {
            await AsyncStorage.getItem("mnemonic").then((data) => console.log(data));
            const jsonValue = JSON.stringify(value)
            console.log("storing mnemonic: ", jsonValue)
            await AsyncStorage.setItem('mnemonic', jsonValue)
            await AsyncStorage.getItem("mnemonic").then((data) => setTrigger(!trigger));
        } catch (e) {
            console.log(e);
            }
        }
    
    const storeAccountInfo = async (value) => {
        try {
            await AsyncStorage.getItem("accountInfo").then((data) => console.log(data));
            const jsonValue = JSON.stringify(value)
            console.log("made it this far: ", jsonValue)
            await AsyncStorage.setItem('accountInfo', jsonValue)
            console.log("maybe here")
            await AsyncStorage.getItem("accountInfo").then((data) => console.log("WOW DATA: ", data));
        } catch (e) {
            console.log(e);
            }
        }

    const generateAccount = async () => {
        if (password.length >= 8) {
            const api = await connect(); 
            const keyring = new Keyring({ type: 'sr25519' });
            const createAccount = (newMnemonic) => {
                newMnemonic = newMnemonic && mnemonicValidate(newMnemonic) 
                        ? newMnemonic 
                        : mnemonicGenerate();
                const account = keyring.addFromUri(newMnemonic, password);
                return { account , newMnemonic };
            }
            var {account, newMnemonic} = createAccount();
            console.log("GENERATED: ", account, newMnemonic)
            await storeAccountInfo(account)
            await storeMnemonic(newMnemonic)
            await seedWallet(newMnemonic)
        } else {
            Toast.show("Password must be longer than 8 characters", 5)
        }
    }

    const addExistingMnemonic = async () => {
        const api = await connect(); 
        const keyring = new Keyring({ type: 'sr25519' });
        if (mnemonicValidate(mnemonicInput)) {
            console.log("VALID MNEMONIC: ", mnemonicInput)
            await storeMnemonic(mnemonicInput)
        } else {
            Toast.show("Must enter a valid mnemonic", 5)
        }
    }

    const clearStorage = async () => {
        AsyncStorage.clear().then((res) => console.log(res));
        await setMnemonic(null)
        await setAccountInfo({})
    }
    async function seedWallet(newMnemonic) {
        const isValidMnemonic = mnemonicValidate(newMnemonic);
        console.log('Mnemonic Validity: ', isValidMnemonic)
        if (mnemonicValidate(newMnemonic)) {
            const api = await connect(); 
            const keyring = new Keyring({ type: 'sr25519' });

            // Add users to keyring. Alice is a known derivation
            const alice = keyring.addFromUri('//Alice')
            const user = keyring.addFromMnemonic(newMnemonic)

            console.log("KEYRING TRANSFER PAIRS", keyring.getPairs(), keyring.getPairs().length)
            console.log("USER ADDRESS", user["address"])

            // Get account balances before transaction
            const unsub = await api.query.system.account.multi(['5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', user["address"]], (balances) => {
                const [{ data: balance1 }, { data: balance2 }] = balances;
            
                console.log(`The balances are ${balance1.free.toHuman()} and ${balance2.free.toHuman()}`);
            });

            // Transfer to happen
            const transfer = api.tx.balances.transfer(user["address"], 10);

            // Get estimated transaction fee pre-transaction (should be 0 partial fee)
            const info = await transfer
            .paymentInfo(alice);
            console.log(`
            class=${info.class.toString()},
            weight=${info.weight.toString()},
            partialFee=${info.partialFee.toHuman()}
            `);

            // Sign and send the transaction using our account
            const hash = await transfer.signAndSend(alice);
            // illness gossip weapon vast cable wet write depart angry used leaf leisure
            console.log('Transfer sent with hash', hash.toHex());

            // Get estimated transaction fee pre-transaction (should be 0 partial fee)
            const unsub1 = await api.query.system.account.multi(['5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', user["address"]], (balances) => {
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
        } else {
            Toast.show("You are not signed in yet! Please either create a wallet from profile page or add existing one using your mnemonic", 5)
        }
    }
    
    return (
        mnemonic && accountInfo.hasOwnProperty('address')  ?
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text
                style={{ fontSize: 20, fontWeight: 'bold' }}>{"Mnemonic Phrase:"}
            </Text>
            <Text
                onPress={clearStorage}
                style={{ fontSize: 12, fontWeight: 'normal' }}>{mnemonic}
            </Text>
            <Text
                style={{ fontSize: 20, fontWeight: 'bold' }}>{"Account Address:"}
            </Text>
            <Text
                onPress={clearStorage}
                style={{ fontSize: 12, fontWeight: 'normal'}}>{accountInfo["address"]}
            </Text>
        </View> :
        <SafeAreaView style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <TextInput
                style={TextBoxStyle.input}
                onChangeText={onChangePassword}
                value={password}
                placeholder="Enter Password"
            />
            <Pressable
                onPress={generateAccount}
                style={SubmitButtonStyle.input}
            >
                <Text>Generate Wallet</Text>
            </Pressable>
            <Text style={{ fontSize: 30, fontWeight: 'bold' }}> OR </Text>
            <TextInput
                style={TextBoxStyle.input}
                onChangeText={onChangeMnemonicInput}
                value={mnemonicInput}
                placeholder="Enter Existing Mnemonic Phrase"
            />
            <Text style={{ fontSize: 10, fontWeight: 'bold' }}> *make sure each word is followed by a single space, no quotes at the end* </Text>
            <Pressable
                onPress={addExistingMnemonic}
                style={SubmitButtonStyle.input}
            >
                <Text>Generate Wallet</Text>
            </Pressable>
        </SafeAreaView>
    );
}

export default Profile;