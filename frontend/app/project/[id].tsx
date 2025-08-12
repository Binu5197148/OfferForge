import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Project {
  _id: string;
  name: string;
  status: string;
  created_at: string;
  language: string;
  brief?: any;
  pain_research?: any;
  generated_offer?: any;
  materials?: any;
}

export default function ProjectDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (id) {
      loadProject();
    }
  }, [id]);

  const loadProject = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/projects/${id}`);
      if (response.ok) {
        const projectData = await response.json();
        setProject(projectData);
      } else {
        Alert.alert('Erro', 'Projeto não encontrado');
        router.back();
      }
    } catch (error) {
      console.error('Error loading project:', error);
      Alert.alert('Erro', 'Falha ao carregar projeto');
    } finally {
      setLoading(false);
    }
  };

  const generateOffer = async () => {
    if (!project) return;
    
    setGenerating(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/generate/offer/${project._id}`, {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          Alert.alert('Sucesso!', 'Oferta gerada com IA!', [
            { text: 'Ver Oferta', onPress: () => loadProject() }
          ]);
        }
      } else {
        Alert.alert('Erro', 'Falha ao gerar oferta');
      }
    } catch (error) {
      console.error('Error generating offer:', error);
      Alert.alert('Erro', 'Erro ao gerar oferta');
    } finally {
      setGenerating(false);
    }
  };

  const generateMaterials = async () => {
    if (!project) return;
    
    setGenerating(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/generate/materials/${project._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(['vsl', 'emails', 'social'])
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          Alert.alert('Sucesso!', 'Materiais gerados com IA!', [
            { text: 'Ver Materiais', onPress: () => loadProject() }
          ]);
        }
      } else {
        Alert.alert('Erro', 'Falha ao gerar materiais');
      }
    } catch (error) {
      console.error('Error generating materials:', error);
      Alert.alert('Erro', 'Erro ao gerar materiais');
    } finally {
      setGenerating(false);
    }
  };

  const generateLandingPage = async () => {
    if (!project) return;
    
    setGenerating(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/generate/landing-page/${project._id}`, {
        method: 'POST',
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          Alert.alert('Sucesso!', 'Landing page gerada!', [
            { text: 'Ver Página', onPress: () => loadProject() }
          ]);
        }
      } else {
        Alert.alert('Erro', 'Falha ao gerar landing page');
      }
    } catch (error) {
      console.error('Error generating landing page:', error);
      Alert.alert('Erro', 'Erro ao gerar landing page');
    } finally {
      setGenerating(false);
    }
  };

  const exportProject = async (exportType: string) => {
    if (!project) return;
    
    setExporting(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/export/${project._id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          project_id: project._id,
          export_type: exportType,
          include_assets: true
        })
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          Alert.alert(
            'Export Concluído!', 
            `${exportType.toUpperCase()} gerado com sucesso!`,
            [
              { text: 'OK', style: 'default' }
            ]
          );
        }
      } else {
        Alert.alert('Erro', `Falha ao exportar ${exportType}`);
      }
    } catch (error) {
      console.error(`Error exporting ${exportType}:`, error);
      Alert.alert('Erro', `Erro ao exportar ${exportType}`);
    } finally {
      setExporting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return '#6c757d';
      case 'brief_completed': return '#28a745';
      case 'research_completed': return '#17a2b8';
      case 'offer_generated': return '#ffc107';
      case 'materials_generated': return '#fd7e14';
      case 'completed': return '#6f42c1';
      default: return '#6c757d';
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'draft': 'Rascunho',
      'brief_completed': 'Brief Completo',
      'research_completed': 'Pesquisa Completa',
      'offer_generated': 'Oferta Gerada',
      'materials_generated': 'Materiais Gerados',
      'completed': 'Concluído'
    };
    return statusMap[status] || status;
  };

  const canGenerateOffer = project?.brief && project?.pain_research;
  const canGenerateMaterials = project?.generated_offer;
  const canGenerateLandingPage = project?.generated_offer;
  const hasAnyMaterials = project?.materials || project?.generated_offer;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Carregando projeto...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!project) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color="#dc3545" />
          <Text style={styles.errorTitle}>Projeto não encontrado</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Voltar</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backIcon}>
          <Ionicons name="chevron-back" size={24} color="#212529" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{project.name}</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Project Info */}
        <View style={styles.section}>
          <View style={styles.projectInfo}>
            <View style={styles.projectHeader}>
              <Text style={styles.projectName}>{project.name}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(project.status) }]}>
                <Text style={styles.statusText}>{getStatusText(project.status)}</Text>
              </View>
            </View>
            
            <Text style={styles.projectDate}>
              Criado em {new Date(project.created_at).toLocaleDateString('pt-BR')}
            </Text>
            
            <View style={styles.projectTags}>
              <View style={styles.languageTag}>
                <Text style={styles.languageText}>
                  {project.language === 'pt-BR' ? '🇧🇷' : '🇺🇸'} {project.language}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Brief Info */}
        {project.brief && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Brief do Produto</Text>
            <View style={styles.infoCard}>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Nicho:</Text>
                <Text style={styles.infoValue}>{project.brief.niche}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Promessa:</Text>
                <Text style={styles.infoValue}>{project.brief.promise}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Preço-alvo:</Text>
                <Text style={styles.infoValue}>
                  {project.brief.currency} {project.brief.target_price}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Generated Offer */}
        {project.generated_offer && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎯 Oferta Gerada pela IA</Text>
            <View style={styles.offerCard}>
              <Text style={styles.headline}>{project.generated_offer.headline}</Text>
              
              {project.generated_offer.proof_elements && (
                <View style={styles.offerSection}>
                  <Text style={styles.offerSectionTitle}>✅ Elementos de Prova</Text>
                  {project.generated_offer.proof_elements.slice(0, 3).map((proof: string, index: number) => (
                    <Text key={index} style={styles.listItem}>• {proof}</Text>
                  ))}
                </View>
              )}
              
              {project.generated_offer.bonuses && (
                <View style={styles.offerSection}>
                  <Text style={styles.offerSectionTitle}>🎁 Bônus</Text>
                  {project.generated_offer.bonuses.slice(0, 2).map((bonus: string, index: number) => (
                    <Text key={index} style={styles.listItem}>• {bonus}</Text>
                  ))}
                </View>
              )}
            </View>
          </View>
        )}

        {/* Materials */}
        {project.materials && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📚 Materiais Gerados</Text>
            
            <View style={styles.materialsGrid}>
              {project.materials.vsl_script && (
                <View style={styles.materialCard}>
                  <Ionicons name="videocam" size={24} color="#dc3545" />
                  <Text style={styles.materialTitle}>VSL Script</Text>
                  <Text style={styles.materialDescription}>
                    {project.materials.vsl_script.estimated_duration}s
                  </Text>
                </View>
              )}
              
              {project.materials.email_sequence && (
                <View style={styles.materialCard}>
                  <Ionicons name="mail" size={24} color="#6f42c1" />
                  <Text style={styles.materialTitle}>E-mails</Text>
                  <Text style={styles.materialDescription}>
                    {project.materials.email_sequence.emails?.length || 0} e-mails
                  </Text>
                </View>
              )}
              
              {project.materials.social_content && (
                <View style={styles.materialCard}>
                  <Ionicons name="share-social" size={24} color="#20c997" />
                  <Text style={styles.materialTitle}>Social</Text>
                  <Text style={styles.materialDescription}>
                    {project.materials.social_content.length} posts
                  </Text>
                </View>
              )}
              
              {project.materials.landing_page && (
                <View style={styles.materialCard}>
                  <Ionicons name="globe" size={24} color="#007AFF" />
                  <Text style={styles.materialTitle}>Landing Page</Text>
                  <Text style={styles.materialDescription}>
                    Mobile-first
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⚡ Ações</Text>
          
          <View style={styles.actionsContainer}>
            {/* Generation Actions */}
            <View style={styles.actionGroup}>
              <Text style={styles.actionGroupTitle}>Gerar com IA</Text>
              
              <TouchableOpacity 
                style={[styles.actionButton, !canGenerateOffer && styles.actionButtonDisabled]}
                onPress={generateOffer}
                disabled={!canGenerateOffer || generating}
              >
                <Ionicons name="sparkles" size={20} color={canGenerateOffer ? "#007AFF" : "#6c757d"} />
                <Text style={[styles.actionButtonText, !canGenerateOffer && styles.actionButtonTextDisabled]}>
                  {generating ? 'Gerando Oferta...' : 'Gerar Oferta'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, !canGenerateMaterials && styles.actionButtonDisabled]}
                onPress={generateMaterials}
                disabled={!canGenerateMaterials || generating}
              >
                <Ionicons name="document-text" size={20} color={canGenerateMaterials ? "#28a745" : "#6c757d"} />
                <Text style={[styles.actionButtonText, !canGenerateMaterials && styles.actionButtonTextDisabled]}>
                  {generating ? 'Gerando Materiais...' : 'Gerar Materiais'}
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, !canGenerateLandingPage && styles.actionButtonDisabled]}
                onPress={generateLandingPage}
                disabled={!canGenerateLandingPage || generating}
              >
                <Ionicons name="globe" size={20} color={canGenerateLandingPage ? "#fd7e14" : "#6c757d"} />
                <Text style={[styles.actionButtonText, !canGenerateLandingPage && styles.actionButtonTextDisabled]}>
                  {generating ? 'Gerando Landing...' : 'Gerar Landing Page'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Export Actions */}
            {hasAnyMaterials && (
              <View style={styles.actionGroup}>
                <Text style={styles.actionGroupTitle}>Exportar</Text>
                
                <TouchableOpacity 
                  style={styles.exportButton}
                  onPress={() => exportProject('zip')}
                  disabled={exporting}
                >
                  <Ionicons name="archive" size={20} color="#6f42c1" />
                  <Text style={styles.exportButtonText}>
                    {exporting ? 'Exportando...' : 'Pacote Completo (ZIP)'}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.exportButton}
                  onPress={() => exportProject('pdf')}
                  disabled={exporting}
                >
                  <Ionicons name="document" size={20} color="#dc3545" />
                  <Text style={styles.exportButtonText}>
                    Relatório (PDF)
                  </Text>
                </TouchableOpacity>
                
                {project.materials?.landing_page && (
                  <TouchableOpacity 
                    style={styles.exportButton}
                    onPress={() => exportProject('html')}
                    disabled={exporting}
                  >
                    <Ionicons name="code" size={20} color="#007AFF" />
                    <Text style={styles.exportButtonText}>
                      Landing Page (HTML)
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginTop: 16,
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  backButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backIcon: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 12,
  },
  projectInfo: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  projectName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#212529',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
  projectDate: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 12,
  },
  projectTags: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageTag: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  languageText: {
    fontSize: 12,
    color: '#495057',
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: '#212529',
    lineHeight: 22,
  },
  offerCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headline: {
    fontSize: 18,
    fontWeight: '700',
    color: '#007AFF',
    marginBottom: 16,
    lineHeight: 24,
  },
  offerSection: {
    marginBottom: 16,
  },
  offerSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  listItem: {
    fontSize: 14,
    color: '#495057',
    marginBottom: 4,
    lineHeight: 20,
  },
  materialsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  materialCard: {
    backgroundColor: 'white',
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  materialTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    marginTop: 8,
    marginBottom: 4,
  },
  materialDescription: {
    fontSize: 12,
    color: '#6c757d',
  },
  actionsContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionGroup: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  actionGroupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 16,
    color: '#212529',
    marginLeft: 12,
    fontWeight: '500',
  },
  actionButtonTextDisabled: {
    color: '#6c757d',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
  },
  exportButtonText: {
    fontSize: 16,
    color: '#212529',
    marginLeft: 12,
    fontWeight: '500',
  },
});