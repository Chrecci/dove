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
    const [dummy, setDummy] = useState(true);
    const [password, onChangePassword] = useState("");
    const wsProvider = new WsProvider('ws://127.0.0.1:9945');
    console.log("mnemonic: ", mnemonic)

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
    // function to asynchronously store value into local device storage
    const storeMnemonic = async (value) => {
        try {
            await AsyncStorage.getItem("mnemonic").then((data) => console.log(data));
            const jsonValue = JSON.stringify(value)
            console.log(jsonValue)
            await AsyncStorage.setItem('mnemonic', jsonValue)
            await AsyncStorage.getItem("mnemonic").then((data) => setMnemonic(data));
            setDummy(!dummy)
        } catch (e) {
            console.log(e);
            }
        }

    const generateMnemonic = async () => {
        const api = await connect(); 
        const keyring = new Keyring({ type: 'sr25519' });
        const createAccount = (mnemonic) => {
            mnemonic = mnemonic && mnemonicValidate(mnemonic) 
                    ? mnemonic 
                    : mnemonicGenerate();
            const account = keyring.addFromUri(mnemonic, password);
            return { account , mnemonic };
        }
        var {account, mnemonic} = createAccount();
        console.log("GENERATED: ", account, mnemonic)
        await storeMnemonic(mnemonic)
    }
    
    return (
        mnemonic ?
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text
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
                <Text>Submit Transaction</Text>
            </Pressable>
        </SafeAreaView>
    );
}

export default Profile;