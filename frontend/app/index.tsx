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
  RefreshControl
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface Project {
  _id: string;
  name: string;
  status: string;
  created_at: string;
  language: string;
  brief?: {
    niche: string;
    target_price: number;
    currency: string;
  };
  generated_offer?: {
    headline: string;
  };
  materials?: any;
}

interface HealthStatus {
  status: string;
  services: {
    mongodb: string;
    openai: string;
    stripe: string;
  };
}

export default function Index() {
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [healthStatus, setHealthStatus] = useState<HealthStatus | null>(null);

  useEffect(() => {
    checkHealthAndLoadProjects();
  }, []);

  const checkHealthAndLoadProjects = async () => {
    try {
      // Check API health
      const healthResponse = await fetch(`${BACKEND_URL}/api/health`);
      const healthData = await healthResponse.json();
      setHealthStatus(healthData);
      
      // Load projects
      const projectsResponse = await fetch(`${BACKEND_URL}/api/projects`);
      const projectsData = await projectsResponse.json();
      setProjects(projectsData);
      
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to connect to server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await checkHealthAndLoadProjects();
    setRefreshing(false);
  };

  const handleCreateProject = () => {
    router.push('/create-project');
  };

  const handleProjectPress = (project: Project) => {
    router.push(`/project/${project._id}`);
  };

  const handleViewDemo = () => {
    router.push('/demo');
  };

  const handleViewAutoDemo = () => {
    router.push('/auto-demo');
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

  const getProgressPercentage = (status: string) => {
    const progressMap: { [key: string]: number } = {
      'draft': 10,
      'brief_completed': 30,
      'research_completed': 50,
      'offer_generated': 70,
      'materials_generated': 90,
      'completed': 100
    };
    return progressMap[status] || 0;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Carregando OfferForge...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>OfferForge</Text>
        <Text style={styles.subtitle}>Crie ofertas irresistíveis com IA</Text>
        
        {/* Enhanced Health Status */}
        {healthStatus && (
          <View style={styles.healthContainer}>
            <View style={styles.healthIndicator}>
              <Ionicons 
                name={healthStatus.status === 'healthy' ? 'checkmark-circle' : 'alert-circle'} 
                size={16} 
                color={healthStatus.status === 'healthy' ? '#28a745' : '#dc3545'} 
              />
              <Text style={[styles.healthText, { 
                color: healthStatus.status === 'healthy' ? '#28a745' : '#dc3545' 
              }]}>
                {healthStatus.status === 'healthy' ? 'Sistema Online' : 'Sistema Offline'}
              </Text>
            </View>
            
            {/* Services Status */}
            <View style={styles.servicesContainer}>
              <View style={styles.serviceStatus}>
                <Ionicons 
                  name={healthStatus.services?.openai === 'configured' ? 'sparkles' : 'warning'} 
                  size={14} 
                  color={healthStatus.services?.openai === 'configured' ? '#007AFF' : '#ffc107'} 
                />
                <Text style={[styles.serviceText, {
                  color: healthStatus.services?.openai === 'configured' ? '#007AFF' : '#ffc107'
                }]}>
                  AI {healthStatus.services?.openai === 'configured' ? 'Ativa' : 'Config'}
                </Text>
              </View>
              
              <View style={styles.serviceStatus}>
                <Ionicons 
                  name={healthStatus.services?.stripe === 'configured' ? 'card' : 'warning'} 
                  size={14} 
                  color={healthStatus.services?.stripe === 'configured' ? '#28a745' : '#ffc107'} 
                />
                <Text style={[styles.serviceText, {
                  color: healthStatus.services?.stripe === 'configured' ? '#28a745' : '#ffc107'
                }]}>
                  Stripe {healthStatus.services?.stripe === 'configured' ? 'Live' : 'Config'}
                </Text>
              </View>
              
              <View style={styles.serviceStatus}>
                <Ionicons 
                  name={healthStatus.services?.mongodb === 'connected' ? 'server' : 'warning'} 
                  size={14} 
                  color={healthStatus.services?.mongodb === 'connected' ? '#6f42c1' : '#dc3545'} 
                />
                <Text style={[styles.serviceText, {
                  color: healthStatus.services?.mongodb === 'connected' ? '#6f42c1' : '#dc3545'
                }]}>
                  DB {healthStatus.services?.mongodb === 'connected' ? 'OK' : 'Error'}
                </Text>
              </View>
            </View>
          </View>
        )}
      </View>

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
      >
        
        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ações Rápidas</Text>
          
          <TouchableOpacity style={styles.primaryButton} onPress={handleCreateProject}>
            <View style={styles.primaryButtonContent}>
              <Ionicons name="add-circle" size={28} color="white" />
              <View style={styles.primaryButtonText}>
                <Text style={styles.primaryButtonTitle}>Novo Projeto</Text>
                <Text style={styles.primaryButtonSubtext}>Configure brief + IA gera tudo</Text>
              </View>
            </View>
          </TouchableOpacity>
          
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={handleViewDemo}>
              <Ionicons name="play-circle" size={32} color="#007AFF" />
              <Text style={styles.actionTitle}>Demo</Text>
              <Text style={styles.actionSubtitle}>Demonstração passo a passo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionCard} onPress={handleViewAutoDemo}>
              <Ionicons name="rocket" size={32} color="#ff6b35" />
              <Text style={styles.actionTitle}>AutoDemo</Text>
              <Text style={styles.actionSubtitle}>Processo 100% automatizado</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.actionGrid}>
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="analytics" size={32} color="#28a745" />
              <Text style={styles.actionTitle}>Métricas</Text>
              <Text style={styles.actionSubtitle}>Performance dos projetos</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionCard}>
              <Ionicons name="library" size={32} color="#6f42c1" />
              <Text style={styles.actionTitle}>Biblioteca</Text>
              <Text style={styles.actionSubtitle}>Templates e recursos</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Projects Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Projetos</Text>
            <Text style={styles.projectsCount}>{projects.length} total</Text>
          </View>
          
          {projects.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="rocket-outline" size={64} color="#6c757d" />
              <Text style={styles.emptyTitle}>Pronto para criar sua primeira oferta?</Text>
              <Text style={styles.emptySubtitle}>
                Com IA avançada, você vai do brief à landing page completa em minutos
              </Text>
              <TouchableOpacity style={styles.emptyButton} onPress={handleCreateProject}>
                <Text style={styles.emptyButtonText}>Começar Agora</Text>
              </TouchableOpacity>
            </View>
          ) : (
            projects.map((project) => (
              <TouchableOpacity 
                key={project._id} 
                style={styles.projectCard}
                onPress={() => handleProjectPress(project)}
              >
                <View style={styles.projectHeader}>
                  <View style={styles.projectInfo}>
                    <Text style={styles.projectName} numberOfLines={1}>{project.name}</Text>
                    {project.brief && (
                      <Text style={styles.projectNiche}>
                        {project.brief.niche} • {project.brief.currency} {project.brief.target_price}
                      </Text>
                    )}
                    {project.generated_offer && (
                      <Text style={styles.projectHeadline} numberOfLines={2}>
                        "{project.generated_offer.headline}"
                      </Text>
                    )}
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(project.status) }]}>
                    <Text style={styles.statusText}>{getStatusText(project.status)}</Text>
                  </View>
                </View>
                
                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View 
                      style={[
                        styles.progressFill, 
                        { 
                          width: `${getProgressPercentage(project.status)}%`,
                          backgroundColor: getStatusColor(project.status)
                        }
                      ]} 
                    />
                  </View>
                  <Text style={styles.progressText}>
                    {getProgressPercentage(project.status)}% completo
                  </Text>
                </View>
                
                <Text style={styles.projectDate}>
                  Atualizado em {new Date(project.created_at).toLocaleDateString('pt-BR')}
                </Text>
                
                <View style={styles.projectFooter}>
                  <View style={styles.projectTags}>
                    <View style={styles.languageTag}>
                      <Text style={styles.languageText}>
                        {project.language === 'pt-BR' ? '🇧🇷' : '🇺🇸'} {project.language}
                      </Text>
                    </View>
                    {project.materials && (
                      <View style={styles.aiTag}>
                        <Ionicons name="sparkles" size={12} color="#007AFF" />
                        <Text style={styles.aiTagText}>IA Completa</Text>
                      </View>
                    )}
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#6c757d" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* AI Workflow Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Como a IA Funciona</Text>
          
          <View style={styles.workflowContainer}>
            <View style={styles.workflowItem}>
              <View style={styles.workflowNumber}>
                <Text style={styles.workflowNumberText}>1</Text>
              </View>
              <View style={styles.workflowContent}>
                <Text style={styles.workflowTitle}>Brief Inteligente</Text>
                <Text style={styles.workflowDescription}>
                  Configure nicho, avatar e dores do público
                </Text>
              </View>
            </View>
            
            <View style={styles.workflowArrow}>
              <Ionicons name="chevron-down" size={16} color="#6c757d" />
            </View>
            
            <View style={styles.workflowItem}>
              <View style={[styles.workflowNumber, { backgroundColor: '#28a745' }]}>
                <Ionicons name="sparkles" size={16} color="white" />
              </View>
              <View style={styles.workflowContent}>
                <Text style={styles.workflowTitle}>IA Gera Oferta</Text>
                <Text style={styles.workflowDescription}>
                  Headlines, provas, bônus e garantias personalizados
                </Text>
              </View>
            </View>
            
            <View style={styles.workflowArrow}>
              <Ionicons name="chevron-down" size={16} color="#6c757d" />
            </View>
            
            <View style={styles.workflowItem}>
              <View style={[styles.workflowNumber, { backgroundColor: '#fd7e14' }]}>
                <Ionicons name="document-text" size={16} color="white" />
              </View>
              <View style={styles.workflowContent}>
                <Text style={styles.workflowTitle}>Materiais Completos</Text>
                <Text style={styles.workflowDescription}>
                  VSL, e-mails, posts sociais e landing page
                </Text>
              </View>
            </View>
            
            <View style={styles.workflowArrow}>
              <Ionicons name="chevron-down" size={16} color="#6c757d" />
            </View>
            
            <View style={styles.workflowItem}>
              <View style={[styles.workflowNumber, { backgroundColor: '#6f42c1' }]}>
                <Ionicons name="download" size={16} color="white" />
              </View>
              <View style={styles.workflowContent}>
                <Text style={styles.workflowTitle}>Export Completo</Text>
                <Text style={styles.workflowDescription}>
                  ZIP, PDF, HTML - pronto para deploy
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Demo Showcase */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚀 Experimente Agora</Text>
          
          <TouchableOpacity style={styles.demoButton} onPress={handleViewDemo}>
            <View style={styles.demoButtonContent}>
              <Ionicons name="play-circle" size={48} color="#007AFF" />
              <View style={styles.demoButtonText}>
                <Text style={styles.demoButtonTitle}>Demo Completo</Text>
                <Text style={styles.demoButtonSubtext}>
                  Veja o OfferForge em ação: do brief ao export em tempo real
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Features Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recursos Disponíveis</Text>
          
          <View style={styles.featuresGrid}>
            <View style={styles.featureCard}>
              <Ionicons name="globe" size={24} color="#007AFF" />
              <Text style={styles.featureTitle}>Multi-idioma</Text>
              <Text style={styles.featureDescription}>pt-BR & en-US</Text>
            </View>
            
            <View style={styles.featureCard}>
              <Ionicons name="download" size={24} color="#28a745" />
              <Text style={styles.featureTitle}>Export HTML</Text>
              <Text style={styles.featureDescription}>ZIP completo</Text>
            </View>
            
            <View style={styles.featureCard}>
              <Ionicons name="videocam" size={24} color="#dc3545" />
              <Text style={styles.featureTitle}>VSL Script</Text>
              <Text style={styles.featureDescription}>90 segundos</Text>
            </View>
            
            <View style={styles.featureCard}>
              <Ionicons name="mail" size={24} color="#6f42c1" />
              <Text style={styles.featureTitle}>Email Seq.</Text>
              <Text style={styles.featureDescription}>5 e-mails</Text>
            </View>
          </View>
        </View>

        {/* Version Info */}
        <View style={styles.section}>
          <View style={styles.versionInfo}>
            <Text style={styles.versionText}>OfferForge v2.2.0</Text>
            <Text style={styles.versionSubtext}>
              Powered by OpenAI GPT-4 • Stripe Live • MongoDB
            </Text>
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
  header: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 12,
  },
  healthContainer: {
    marginTop: 8,
  },
  healthIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  healthText: {
    marginLeft: 6,
    fontSize: 14,
    fontWeight: '500',
  },
  servicesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  serviceStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  serviceText: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
  },
  projectsCount: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 24,
  },
  primaryButtonText: {
    marginLeft: 16,
    flex: 1,
  },
  primaryButtonTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  primaryButtonSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  actionGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    backgroundColor: 'white',
    flex: 0.48,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginTop: 12,
    marginBottom: 4,
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
  },
  emptyState: {
    backgroundColor: 'white',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  emptyButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  projectCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
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
    marginBottom: 12,
  },
  projectInfo: {
    flex: 1,
    marginRight: 12,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  projectNiche: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  projectHeadline: {
    fontSize: 12,
    color: '#007AFF',
    fontStyle: 'italic',
    lineHeight: 16,
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
  progressContainer: {
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
  },
  projectDate: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 12,
  },
  projectFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    marginRight: 8,
  },
  languageText: {
    fontSize: 12,
    color: '#495057',
    fontWeight: '500',
  },
  aiTag: {
    backgroundColor: '#e7f3ff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiTagText: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
    marginLeft: 4,
  },
  workflowContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  workflowItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  workflowNumber: {
    width: 32,
    height: 32,
    backgroundColor: '#007AFF',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  workflowNumberText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  workflowContent: {
    flex: 1,
  },
  workflowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  workflowDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  workflowArrow: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  demoButton: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 8,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  demoButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  demoButtonText: {
    marginLeft: 20,
    flex: 1,
  },
  demoButtonTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 4,
  },
  demoButtonSubtext: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  featureCard: {
    backgroundColor: 'white',
    width: '48%',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    marginTop: 8,
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 12,
    color: '#6c757d',
  },
  versionInfo: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  versionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 4,
  },
  versionSubtext: {
    fontSize: 12,
    color: '#9ca3af',
    textAlign: 'center',
  },
});