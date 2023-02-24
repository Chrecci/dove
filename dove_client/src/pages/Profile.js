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
    
    AsyncStorage.getItem('mnemonic').then(
        // AsyncStorage stores jsonified strings, so they have quotations around them. Remove quotations
        (data) => data !== null ? setMnemonic(data.slice(1, -1)) : console.log("nonexistent recipient")
    );

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
            console.log(jsonValue)
            await AsyncStorage.setItem('mnemonic', jsonValue)
            await AsyncStorage.getItem("mnemonic").then((data) => setMnemonic(data));
        } catch (e) {
            console.log(e);
            }
        }

    const generateMnemonic = async () => {
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
            await storeMnemonic(newMnemonic)
            await setAccountInfo(account)
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
    }
    
    return (
        mnemonic ?
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text
                onPress={clearStorage}
                style={{ fontSize: 12, fontWeight: 'bold' }}>{mnemonic}
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
                onPress={generateMnemonic}
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