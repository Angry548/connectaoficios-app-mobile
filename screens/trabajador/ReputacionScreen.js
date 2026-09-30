import React, { useState, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    ActivityIndicator, 
    FlatList, 
    SafeAreaView 
} from 'react-native';

import { reputacionService } from '../../services/reputacionService';

const ReputacionScreen = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    const perfilTrabajadorId = 1; 

    useEffect(() => {
        cargarReputacion();
    }, []);

    const cargarReputacion = async () => {
        try {
            setLoading(true);
           
            
            const data = await reputacionService.obtenerPorPerfilTrabajador(perfilTrabajadorId);
            setDashboardData(data);
        } catch (err) {
            setError('No pudimos cargar tu información de reputación en este momento.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const renderInsignia = ({ item }) => (
        <View style={styles.badgeCard}>
            <View style={styles.badgeIconPlaceholder}>
                <Text style={styles.badgeIconText}>{item.nombre ? item.nombre.charAt(0) : '🏆'}</Text>
            </View>
            <Text style={styles.badgeName}>{item.nombre}</Text>
            <Text style={styles.badgeDescription}>{item.descripcion}</Text>
        </View>
    );

    if (loading) {
        return (
            <View style={styles.centered}>
                <ActivityIndicator size="large" color="#0066cc" />
                <Text style={styles.loadingText}>Cargando reputación...</Text>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centered}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <Text style={styles.screenTitle}>Mi Desempeño</Text>
            
            <View style={styles.metricsContainer}>
                <View style={styles.scoreCircle}>
                    <Text style={styles.scoreValue}>{dashboardData?.puntuacionGlobal?.toFixed(1) || '0.0'}</Text>
                    <Text style={styles.scoreMax}>/ 5.0</Text>
                </View>
                <View style={styles.statsContainer}>
                    <Text style={styles.statText}>✅ {dashboardData?.trabajosCompletados || 0} Trabajos</Text>
                    <Text style={styles.statText}>⭐ {dashboardData?.resenasRecibidas || 0} Reseñas</Text>
                    <Text style={styles.statText}>🏆 Nivel: {dashboardData?.nivel || 'Principiante'}</Text>
                </View>
            </View>

            <Text style={styles.sectionTitle}>Mis Insignias ({dashboardData?.insignias?.length || 0})</Text>
            
            <FlatList
                data={dashboardData?.insignias || []}
                keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
                renderItem={renderInsignia}
                numColumns={2}
                columnWrapperStyle={styles.row}
                ListEmptyComponent={
                    <Text style={styles.emptyText}>Aún no tienes insignias. ¡Sigue haciendo un buen trabajo para ganar algunas!</Text>
                }
                showsVerticalScrollIndicator={false}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F5F7FA', paddingHorizontal: 16 },
    centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
    loadingText: { marginTop: 10, color: '#666' },
    errorText: { color: '#e74c3c', textAlign: 'center', padding: 20, fontSize: 16 },
    screenTitle: { fontSize: 24, fontWeight: 'bold', color: '#2C3E50', marginTop: 20, marginBottom: 16 },
    metricsContainer: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, marginBottom: 24, alignItems: 'center' },
    scoreCircle: { width: 90, height: 90, borderRadius: 45, backgroundColor: '#E8F4F8', justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#3498DB' },
    scoreValue: { fontSize: 28, fontWeight: 'bold', color: '#2C3E50' },
    scoreMax: { fontSize: 12, color: '#7F8C8D', marginTop: -4 },
    statsContainer: { marginLeft: 20, justifyContent: 'center' },
    statText: { fontSize: 15, color: '#34495E', marginBottom: 6, fontWeight: '500' },
    sectionTitle: { fontSize: 18, fontWeight: '600', color: '#2C3E50', marginBottom: 12 },
    row: { justifyContent: 'space-between', marginBottom: 12 },
    badgeCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginHorizontal: 6, alignItems: 'center', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
    badgeIconPlaceholder: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#F1C40F', justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
    badgeIconText: { fontSize: 24, fontWeight: 'bold', color: '#FFF' },
    badgeName: { fontSize: 14, fontWeight: 'bold', color: '#2C3E50', textAlign: 'center', marginBottom: 4 },
    badgeDescription: { fontSize: 12, color: '#7F8C8D', textAlign: 'center' },
    emptyText: { textAlign: 'center', color: '#95A5A6', marginTop: 20, paddingHorizontal: 20, fontStyle: 'italic' }
});

export default ReputacionScreen;