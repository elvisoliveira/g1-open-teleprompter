import { MaterialIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ButtonStyles, ContainerStyles, EmptyStateStyles } from '../styles/CommonStyles';
import { MaterialBorderRadius, MaterialColors, MaterialSpacing, MaterialTypography } from '../styles/MaterialTheme';
import SlidesScreen from './SlidesScreen';

interface Slide {
    id: string;
    text: string;
}

interface Presentation {
    id: string;
    name: string;
    slides: Slide[];
}

const STORAGE_KEY = 'presentations_data';

interface PresentationsScreenProps {
}

const PresentationsScreen: React.FC<PresentationsScreenProps> = () => {
    const [presentations, setPresentations] = useState<Presentation[]>([]);
    const [selectedPresentation, setSelectedPresentation] = useState<Presentation | null>(null);
    const [newPresentationName, setNewPresentationName] = useState('');
    const [showAddPresentation, setShowAddPresentation] = useState(false);
    const [editingPresentationId, setEditingPresentationId] = useState<string | null>(null);
    const [editText, setEditText] = useState('');

    useEffect(() => {
        loadPresentations();
    }, []);

    const loadPresentations = async () => {
        try {
            const data = await AsyncStorage.getItem(STORAGE_KEY);
            if (data) {
                setPresentations(JSON.parse(data));
            }
        } catch (error) {
            console.error('Failed to load presentations:', error);
        }
    };

    const savePresentations = async (data: Presentation[]) => {
        try {
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
            setPresentations(data);
        } catch (error) {
            console.error('Failed to save presentations:', error);
        }
    };

    const addPresentation = () => {
        if (!newPresentationName.trim()) return;
        
        const newPresentation: Presentation = {
            id: Date.now().toString(),
            name: newPresentationName.trim(),
            slides: []
        };
        
        const updatedPresentations = [...presentations, newPresentation];
        savePresentations(updatedPresentations);
        setNewPresentationName('');
        setShowAddPresentation(false);
    };

    const deletePresentation = (id: string) => {
        Alert.alert(
            'Delete Presentation',
            'Are you sure you want to delete this presentation?',
            [
                { text: 'Cancel', style: 'cancel' },
                { 
                    text: 'Delete', 
                    style: 'destructive',
                    onPress: () => {
                        const updated = presentations.filter(p => p.id !== id);
                        savePresentations(updated);
                        if (selectedPresentation?.id === id) {
                            setSelectedPresentation(null);
                        }
                    }
                }
            ]
        );
    };

    const startEditingPresentation = (presentation: Presentation) => {
        setEditingPresentationId(presentation.id);
        setEditText(presentation.name);
    };

    const saveEditPresentation = () => {
        if (!editText.trim() || !editingPresentationId) return;
        
        const updatedPresentations = presentations.map(p => 
            p.id === editingPresentationId 
                ? { ...p, name: editText.trim() }
                : p
        );
        
        savePresentations(updatedPresentations);
        if (selectedPresentation?.id === editingPresentationId) {
            setSelectedPresentation({ ...selectedPresentation, name: editText.trim() });
        }
        setEditingPresentationId(null);
        setEditText('');
    };

    const cancelEdit = () => {
        setEditingPresentationId(null);
        setEditText('');
    };

    const handleUpdatePresentation = (updatedPresentation: Presentation) => {
        const updatedPresentations = presentations.map(p => 
            p.id === updatedPresentation.id ? updatedPresentation : p
        );
        savePresentations(updatedPresentations);
        setSelectedPresentation(updatedPresentation);
    };

    if (selectedPresentation) {
        return (
            <SlidesScreen
                presentation={selectedPresentation}
                onGoBack={() => setSelectedPresentation(null)}
                onUpdatePresentation={handleUpdatePresentation}
            />
        );
    }

    return (
        <View style={ContainerStyles.screen}>
            <View style={ContainerStyles.content}>
                <View style={[ContainerStyles.row, { marginBottom: MaterialSpacing.lg }]}>
                    <Text style={[MaterialTypography.headlineSmall, { flex: 1 }]}>
                        Presentations
                    </Text>
                    <TouchableOpacity
                        onPress={() => setShowAddPresentation(true)}
                        style={ButtonStyles.primaryButton}
                    >
                        <MaterialIcons name="add" size={20} color={MaterialColors.onPrimary} />
                    </TouchableOpacity>
                </View>

                {showAddPresentation && (
                    <View style={[
                        { 
                            backgroundColor: MaterialColors.surface,
                            borderRadius: MaterialBorderRadius.md,
                            borderWidth: 1,
                            borderColor: MaterialColors.outline,
                            padding: MaterialSpacing.lg,
                            marginBottom: MaterialSpacing.lg 
                        }
                    ]}>
                        <TextInput
                            style={[MaterialTypography.bodyLarge, { marginBottom: MaterialSpacing.md }]}
                            value={newPresentationName}
                            onChangeText={setNewPresentationName}
                            placeholder="Enter presentation name..."
                            placeholderTextColor={MaterialColors.onSurfaceVariant}
                        />
                        <View style={ContainerStyles.row}>
                            <TouchableOpacity
                                onPress={() => setShowAddPresentation(false)}
                                style={[ButtonStyles.secondaryButton, { flex: 1, marginRight: MaterialSpacing.sm }]}
                            >
                                <Text style={ButtonStyles.secondaryButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={addPresentation}
                                style={[ButtonStyles.primaryButton, { flex: 2 }]}
                            >
                                <Text style={ButtonStyles.primaryButtonText}>Add Presentation</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}

                {presentations.length === 0 ? (
                    <View style={EmptyStateStyles.container}>
                        <MaterialIcons 
                            name="slideshow" 
                            size={64} 
                            color={MaterialColors.onSurfaceVariant} 
                            style={EmptyStateStyles.icon}
                        />
                        <Text style={EmptyStateStyles.title}>
                            No Presentations Yet
                        </Text>
                        <Text style={EmptyStateStyles.subtitle}>
                            Create your first presentation to get started with organizing your slides and content.
                        </Text>
                    </View>
                ) : (
                    <FlatList
                        data={presentations}
                        keyExtractor={item => item.id}
                        renderItem={({ item }) => (
                            <View style={{
                                backgroundColor: MaterialColors.surfaceVariant,
                                borderRadius: MaterialBorderRadius.md,
                                marginBottom: MaterialSpacing.md,
                                padding: MaterialSpacing.lg,
                                minHeight: 80,
                            }}>
                                {editingPresentationId === item.id ? (
                                    <View>
                                        <TextInput
                                            style={[MaterialTypography.bodyLarge, { marginBottom: MaterialSpacing.md }]}
                                            value={editText}
                                            onChangeText={setEditText}
                                            placeholder="Enter presentation name..."
                                            placeholderTextColor={MaterialColors.onSurfaceVariant}
                                            autoFocus
                                        />
                                        <View style={ContainerStyles.row}>
                                            <TouchableOpacity
                                                onPress={cancelEdit}
                                                style={[ButtonStyles.secondaryButton, { flex: 1, marginRight: MaterialSpacing.sm }]}
                                            >
                                                <Text style={ButtonStyles.secondaryButtonText}>Cancel</Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity
                                                onPress={saveEditPresentation}
                                                style={[ButtonStyles.primaryButton, { flex: 1 }]}
                                            >
                                                <Text style={ButtonStyles.primaryButtonText}>Save</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                ) : (
                                    <View style={{ flex: 1 }}>
                                        <TouchableOpacity
                                            onPress={() => setSelectedPresentation(item)}
                                            style={{ flex: 1 }}
                                            activeOpacity={0.8}
                                        >
                                            <Text style={[MaterialTypography.headlineSmall, { 
                                                color: MaterialColors.onSurface, 
                                                marginBottom: MaterialSpacing.xs 
                                            }]}>
                                                {item.name}
                                            </Text>
                                            <Text style={[MaterialTypography.bodyMedium, { 
                                                color: MaterialColors.onSurfaceVariant,
                                                marginBottom: MaterialSpacing.md
                                            }]}>
                                                {item.slides.length} slides
                                            </Text>
                                        </TouchableOpacity>
                                        <View style={{ 
                                            flexDirection: 'row', 
                                            justifyContent: 'flex-end',
                                            gap: MaterialSpacing.xs 
                                        }}>
                                            <TouchableOpacity 
                                                onPress={() => startEditingPresentation(item)}
                                                style={{
                                                    backgroundColor: MaterialColors.primary,
                                                    paddingHorizontal: MaterialSpacing.md,
                                                    paddingVertical: MaterialSpacing.sm,
                                                    borderRadius: MaterialBorderRadius.lg,
                                                }}
                                            >
                                                <Text style={[MaterialTypography.labelMedium, { 
                                                    color: MaterialColors.onPrimary, 
                                                    fontWeight: 'bold' 
                                                }]}>
                                                    Edit
                                                </Text>
                                            </TouchableOpacity>
                                            <TouchableOpacity 
                                                onPress={() => deletePresentation(item.id)}
                                                style={{
                                                    backgroundColor: MaterialColors.error,
                                                    paddingHorizontal: MaterialSpacing.md,
                                                    paddingVertical: MaterialSpacing.sm,
                                                    borderRadius: MaterialBorderRadius.lg,
                                                }}
                                            >
                                                <Text style={[MaterialTypography.labelMedium, { 
                                                    color: MaterialColors.onError, 
                                                    fontWeight: 'bold' 
                                                }]}>
                                                    Delete
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                )}
                            </View>
                        )}
                        showsVerticalScrollIndicator={false}
                    />
                )}
            </View>
        </View>
    );
};

export default PresentationsScreen;
