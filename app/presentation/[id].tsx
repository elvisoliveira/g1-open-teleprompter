import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import SlidesScreen from '../../components/SlidesScreen';
import { useOutputMode } from '../../hooks/useOutputMode';
import { Presentation } from '../../services/DeviceTypes';
import GlassesController from '../../services/GlassesController';

const STORAGE_KEY = 'presentations_data';

export default function PresentationScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const { outputMode } = useOutputMode();
    const [presentations, setPresentations] = useState<Presentation[] | null>(null);
    const [glasses, setGlasses] = useState({ left: false, right: false });

    useEffect(() => GlassesController.onConnectionStateChange(setGlasses), []);

    useEffect(() => {
        AsyncStorage.getItem(STORAGE_KEY)
            .then(data => setPresentations(data ? JSON.parse(data) : []))
            .catch(error => {
                console.error('Failed to load presentations:', error);
                setPresentations([]);
            });
    }, []);

    const presentation = presentations?.find(p => p.id === id);

    // Loaded but not found (e.g. deleted) → leave the screen
    useEffect(() => {
        if (presentations && !presentation) {
            router.back();
        }
    }, [presentations, presentation]);

    if (!presentation) return null;

    const handleUpdatePresentation = async (updated: Presentation) => {
        const next = presentations!.map(p => p.id === updated.id ? updated : p);
        setPresentations(next);
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch (error) {
            console.error('Failed to save presentations:', error);
        }
    };

    return (
        <SlidesScreen
            presentation={presentation}
            onGoBack={() => router.back()}
            onUpdatePresentation={handleUpdatePresentation}
            outputMode={outputMode}
            leftConnected={glasses.left}
            rightConnected={glasses.right}
        />
    );
}
