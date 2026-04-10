import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

export default function GenericScreen({ route, navigation }) {
    return (
        <View style={styles.container}>
            <Text style={styles.text}>{route.name} Screen Placeholder</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f5f5f5',
    },
    text: {
        fontSize: 20,
        fontWeight: 'bold',
    },
});
