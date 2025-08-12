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
  Dimensions
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;
const { width, height } = Dimensions.get('window');

interface DemoStep {
  id: number;
  title: string;
  description: string;
  icon: string;
  color: string;
  action: () => Promise<void>;
  completed: boolean;
  loading: boolean;
  result?: any;
}

export default function Demo() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [demoProject, setDemoProject] = useState<any>(null);
  const [overallProgress, setOverallProgress] = useState(0);

  const [demoSteps, setDemoSteps] = useState<DemoStep[]>([
    {
      id: 1,
      title: 'Verificar Sistema',
      description: 'Validar conectividade com IA, Stripe e MongoDB',
      icon: 'checkmark-circle',
      color: '#28a745',
      action: checkSystemHealth,
      completed: false,
      loading: false
    },
    {
      id: 2,
      title: 'Criar Projeto Demo',
      description: 'Projeto: "Curso de Marketing Digital Avançado"',
      icon: 'document-text',
      color: '#007AFF',
      action: createDemoProject,
      completed: false,
      loading: false
    },
    {
      id: 3,
      title: 'Gerar Oferta com IA',
      description: 'OpenAI GPT-4 cria headline, provas e bônus',
      icon: 'sparkles',
      color: '#ffc107',
      action: generateOffer,
      completed: false,
      loading: false
    },
    {
      id: 4,
      title: 'Gerar Materiais',
      description: 'VSL script, sequência de e-mails e posts sociais',
      icon: 'folder',
      color: '#fd7e14',
      action: generateMaterials,
      completed: false,
      loading: false
    },
    {
      id: 5,
      title: 'Gerar Landing Page',
      description: 'Template mobile-first responsivo',
      icon: 'globe',
      color: '#6f42c1',
      action: generateLandingPage,
      completed: false,
      loading: false
    },
    {
      id: 6,
      title: 'Exportar Tudo',
      description: 'ZIP completo, PDF e HTML para deploy',
      icon: 'download',
      color: '#20c997',
      action: exportAll,
      completed: false,
      loading: false
    }
  ]);

  useEffect(() => {
    const completedSteps = demoSteps.filter(step => step.completed).length;
    setOverallProgress((completedSteps / demoSteps.length) * 100);
  }, [demoSteps]);

  async function checkSystemHealth(): Promise<void> {
    const response = await fetch(`${BACKEND_URL}/api/health`);
    const health = await response.json();
    
    if (health.status === 'healthy' && 
        health.services.openai === 'configured' && 
        health.services.stripe === 'configured' && 
        health.services.mongodb === 'connected') {
      return health;
    } else {
      throw new Error('Sistema não está completamente configurado');
    }
  }

  async function createDemoProject(): Promise<void> {
    // Create project
    const projectData = {
      name: 'Demo: Curso de Marketing Digital Avançado',
      user_id: 'demo-user',
      language: 'pt-BR'
    };

    const projectResponse = await fetch(`${BACKEND_URL}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData)
    });

    if (!projectResponse.ok) throw new Error('Falha ao criar projeto');
    const project = await projectResponse.json();

    // Add brief and pain research
    const briefData = {
      niche: 'Marketing Digital',
      avatar_id: 'demo-avatar',
      promise: 'Aprenda as estratégias mais avançadas de marketing digital e gere R$ 10.000/mês em até 90 dias, mesmo sendo iniciante',
      target_price: 497,
      currency: 'BRL',
      additional_notes: 'Avatar: Empreendedor Digital Iniciante (25-45 anos)'
    };

    const painResearchData = {
      pain_points: [
        { description: 'Não sabe por onde começar no marketing digital', frequency: 3, source: 'manual', category: 'conhecimento' },
        { description: 'Perde dinheiro com estratégias que não funcionam', frequency: 2, source: 'manual', category: 'financeiro' },
        { description: 'Não consegue atrair clientes qualificados online', frequency: 3, source: 'manual', category: 'vendas' },
        { description: 'Tem medo de investir e não ter retorno', frequency: 2, source: 'manual', category: 'psicológico' }
      ],
      reviews: [
        'Comprei vários cursos mas nenhum me ensinou a implementar de verdade',
        'Preciso de algo prático que me ajude a sair do zero',
        'Já gastei muito dinheiro sem ver resultado nenhum'
      ],
      faqs: [
        'Funciona para iniciantes?',
        'Quanto tempo leva para ver resultados?',
        'Preciso investir muito dinheiro em anúncios?'
      ],
      manual_input: 'Pesquisa baseada em análise de mercado do nicho de marketing digital'
    };

    const updateResponse = await fetch(`${BACKEND_URL}/api/projects/${project._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        brief: briefData,
        pain_research: painResearchData,
        status: 'research_completed'
      })
    });

    if (!updateResponse.ok) throw new Error('Falha ao atualizar projeto');
    const updatedProject = await updateResponse.json();
    setDemoProject(updatedProject);
    return updatedProject;
  }

  async function generateOffer(): Promise<void> {
    if (!demoProject) throw new Error('Projeto demo não encontrado');

    const response = await fetch(`${BACKEND_URL}/api/generate/offer/${demoProject._id}`, {
      method: 'POST'
    });

    if (!response.ok) throw new Error('Falha ao gerar oferta');
    const result = await response.json();
    
    if (!result.success) throw new Error('IA falhou ao gerar oferta');
    return result.offer;
  }

  async function generateMaterials(): Promise<void> {
    if (!demoProject) throw new Error('Projeto demo não encontrado');

    const response = await fetch(`${BACKEND_URL}/api/generate/materials/${demoProject._id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(['vsl', 'emails', 'social'])
    });

    if (!response.ok) throw new Error('Falha ao gerar materiais');
    const result = await response.json();
    
    if (!result.success) throw new Error('IA falhou ao gerar materiais');
    return result.materials;
  }

  async function generateLandingPage(): Promise<void> {
    if (!demoProject) throw new Error('Projeto demo não encontrado');

    const response = await fetch(`${BACKEND_URL}/api/generate/landing-page/${demoProject._id}`, {
      method: 'POST'
    });

    if (!response.ok) throw new Error('Falha ao gerar landing page');
    const result = await response.json();
    
    if (!result.success) throw new Error('IA falhou ao gerar landing page');
    return result.landing_page;
  }

  async function exportAll(): Promise<void> {
    if (!demoProject) throw new Error('Projeto demo não encontrado');

    const exports = [];
    
    // Export ZIP
    const zipResponse = await fetch(`${BACKEND_URL}/api/export/${demoProject._id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: demoProject._id, export_type: 'zip', include_assets: true })
    });
    
    if (zipResponse.ok) {
      const zipResult = await zipResponse.json();
      exports.push({ type: 'ZIP', size: `${Math.round(zipResult.file_data.length / 1024)} KB` });
    }

    // Export PDF
    const pdfResponse = await fetch(`${BACKEND_URL}/api/export/${demoProject._id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: demoProject._id, export_type: 'pdf', include_assets: true })
    });
    
    if (pdfResponse.ok) {
      const pdfResult = await pdfResponse.json();
      exports.push({ type: 'PDF', size: `${Math.round(pdfResult.file_data.length / 1024)} KB` });
    }

    return exports;
  }

  const executeStep = async (stepIndex: number) => {
    const newSteps = [...demoSteps];
    newSteps[stepIndex].loading = true;
    setDemoSteps(newSteps);
    setCurrentStep(stepIndex);

    try {
      const result = await newSteps[stepIndex].action();
      newSteps[stepIndex].completed = true;
      newSteps[stepIndex].result = result;
      newSteps[stepIndex].loading = false;
      setDemoSteps(newSteps);
      
      // Auto-advance to next step after 1 second
      setTimeout(() => {
        if (stepIndex < demoSteps.length - 1) {
          setCurrentStep(stepIndex + 1);
        }
      }, 1000);
      
    } catch (error) {
      newSteps[stepIndex].loading = false;
      setDemoSteps(newSteps);
      Alert.alert('Erro', `Passo ${stepIndex + 1}: ${error.message}`);
    }
  };

  const runFullDemo = async () => {
    for (let i = 0; i < demoSteps.length; i++) {
      if (!demoSteps[i].completed) {
        await executeStep(i);
        // Wait 2 seconds between steps for demo effect
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  };

  const resetDemo = () => {
    const resetSteps = demoSteps.map(step => ({
      ...step,
      completed: false,
      loading: false,
      result: undefined
    }));
    setDemoSteps(resetSteps);
    setCurrentStep(0);
    setDemoProject(null);
  };

  const viewProject = () => {
    if (demoProject) {
      router.push(`/project/${demoProject._id}`);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#212529" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Demo OfferForge</Text>
        <TouchableOpacity onPress={resetDemo} style={styles.resetButton}>
          <Ionicons name="refresh" size={24} color="#6c757d" />
        </TouchableOpacity>
      </View>

      {/* Progress Overview */}
      <View style={styles.progressSection}>
        <Text style={styles.progressTitle}>Demonstração Completa</Text>
        <Text style={styles.progressDescription}>
          Experiência end-to-end: Brief → IA → Materiais → Export
        </Text>
        
        <View style={styles.overallProgress}>
          <View style={styles.progressBar}>
            <View 
              style={[styles.progressFill, { width: `${overallProgress}%` }]} 
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(overallProgress)}% Concluído
          </Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        
        {/* Demo Controls */}
        <View style={styles.section}>
          <View style={styles.controlsContainer}>
            <TouchableOpacity 
              style={[styles.runDemoButton, overallProgress === 100 && styles.runDemoButtonComplete]}
              onPress={runFullDemo}
              disabled={overallProgress === 100}
            >
              <Ionicons 
                name={overallProgress === 100 ? "checkmark-circle" : "play-circle"} 
                size={24} 
                color="white" 
              />
              <Text style={styles.runDemoButtonText}>
                {overallProgress === 100 ? 'Demo Completo!' : 'Executar Demo Completo'}
              </Text>
            </TouchableOpacity>
            
            {demoProject && (
              <TouchableOpacity style={styles.viewProjectButton} onPress={viewProject}>
                <Ionicons name="eye" size={20} color="#007AFF" />
                <Text style={styles.viewProjectButtonText}>Ver Projeto Criado</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Demo Steps */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Etapas da Demonstração</Text>
          
          {demoSteps.map((step, index) => (
            <TouchableOpacity 
              key={step.id}
              style={[
                styles.stepCard,
                currentStep === index && styles.stepCardActive,
                step.completed && styles.stepCardCompleted
              ]}
              onPress={() => executeStep(index)}
              disabled={step.loading}
            >
              <View style={styles.stepHeader}>
                <View style={[styles.stepIcon, { backgroundColor: step.color }]}>
                  {step.loading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Ionicons 
                      name={step.completed ? "checkmark" : step.icon as any} 
                      size={20} 
                      color="white" 
                    />
                  )}
                </View>
                
                <View style={styles.stepInfo}>
                  <Text style={styles.stepTitle}>{step.title}</Text>
                  <Text style={styles.stepDescription}>{step.description}</Text>
                </View>
                
                <View style={styles.stepStatus}>
                  {step.loading ? (
                    <Text style={styles.stepStatusText}>Executando...</Text>
                  ) : step.completed ? (
                    <Text style={[styles.stepStatusText, { color: '#28a745' }]}>Concluído</Text>
                  ) : (
                    <Text style={styles.stepStatusText}>Pendente</Text>
                  )}
                </View>
              </View>
              
              {/* Step Result */}
              {step.result && (
                <View style={styles.stepResult}>
                  <Text style={styles.stepResultTitle}>Resultado:</Text>
                  {step.id === 1 && (
                    <Text style={styles.stepResultText}>
                      ✅ Sistema saudável • IA: {step.result.services.openai} • Stripe: {step.result.services.stripe}
                    </Text>
                  )}
                  {step.id === 2 && (
                    <Text style={styles.stepResultText}>
                      📋 Projeto "{step.result.name}" criado com sucesso
                    </Text>
                  )}
                  {step.id === 3 && (
                    <Text style={styles.stepResultText} numberOfLines={3}>
                      🎯 "{step.result.headline}"
                    </Text>
                  )}
                  {step.id === 4 && (
                    <Text style={styles.stepResultText}>
                      📚 VSL + {step.result.email_sequence?.emails?.length || 0} e-mails + {step.result.social_content?.length || 0} posts
                    </Text>
                  )}
                  {step.id === 5 && (
                    <Text style={styles.stepResultText}>
                      🌐 Template "{step.result.template_name}" • Mobile-first
                    </Text>
                  )}
                  {step.id === 6 && (
                    <Text style={styles.stepResultText}>
                      📦 {step.result.length} arquivos exportados
                    </Text>
                  )}
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Demo Highlights */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Destaques da Demonstração</Text>
          
          <View style={styles.highlightsContainer}>
            <View style={styles.highlightCard}>
              <Ionicons name="flash" size={24} color="#ffc107" />
              <Text style={styles.highlightTitle}>IA Avançada</Text>
              <Text style={styles.highlightDescription}>
                OpenAI GPT-4 gera conteúdo contextualizado
              </Text>
            </View>
            
            <View style={styles.highlightCard}>
              <Ionicons name="phone-portrait" size={24} color="#007AFF" />
              <Text style={styles.highlightTitle}>Mobile-First</Text>
              <Text style={styles.highlightDescription}>
                Design otimizado para dispositivos móveis
              </Text>
            </View>
            
            <View style={styles.highlightCard}>
              <Ionicons name="rocket" size={24} color="#28a745" />
              <Text style={styles.highlightTitle}>Deploy Pronto</Text>
              <Text style={styles.highlightDescription}>
                Exports prontos para produção
              </Text>
            </View>
            
            <View style={styles.highlightCard}>
              <Ionicons name="globe" size={24} color="#6f42c1" />
              <Text style={styles.highlightTitle}>Multi-idioma</Text>
              <Text style={styles.highlightDescription}>
                Português e inglês nativos
              </Text>
            </View>
          </View>
        </View>

        {/* Technical Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Especificações Técnicas</Text>
          
          <View style={styles.techInfoContainer}>
            <View style={styles.techInfoRow}>
              <Text style={styles.techInfoLabel}>Frontend:</Text>
              <Text style={styles.techInfoValue}>Expo React Native + TypeScript</Text>
            </View>
            <View style={styles.techInfoRow}>
              <Text style={styles.techInfoLabel}>Backend:</Text>
              <Text style={styles.techInfoValue}>FastAPI + Python + MongoDB</Text>
            </View>
            <View style={styles.techInfoRow}>
              <Text style={styles.techInfoLabel}>IA:</Text>
              <Text style={styles.techInfoValue}>OpenAI GPT-4 + Prompts Avançados</Text>
            </View>
            <View style={styles.techInfoRow}>
              <Text style={styles.techInfoLabel}>Pagamentos:</Text>
              <Text style={styles.techInfoValue}>Stripe Live API + Analytics</Text>
            </View>
            <View style={styles.techInfoRow}>
              <Text style={styles.techInfoLabel}>Exports:</Text>
              <Text style={styles.techInfoValue}>ZIP + PDF + HTML + JSON</Text>
            </View>
            <View style={styles.techInfoRow}>
              <Text style={styles.techInfoLabel}>Versão:</Text>
              <Text style={styles.techInfoValue}>OfferForge v2.2.0</Text>
            </View>
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
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
  },
  resetButton: {
    padding: 4,
  },
  progressSection: {
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  progressTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 4,
  },
  progressDescription: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 16,
  },
  overallProgress: {
    marginBottom: 4,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
    minWidth: 8,
  },
  progressText: {
    fontSize: 14,
    color: '#495057',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 16,
  },
  controlsContainer: {
    alignItems: 'center',
  },
  runDemoButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
  },
  runDemoButtonComplete: {
    backgroundColor: '#28a745',
  },
  runDemoButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  viewProjectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  viewProjectButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  stepCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  stepCardActive: {
    borderColor: '#007AFF',
  },
  stepCardCompleted: {
    borderColor: '#28a745',
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepInfo: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  stepStatus: {
    alignItems: 'flex-end',
  },
  stepStatusText: {
    fontSize: 12,
    color: '#6c757d',
    fontWeight: '500',
  },
  stepResult: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  stepResultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
    marginBottom: 6,
  },
  stepResultText: {
    fontSize: 14,
    color: '#212529',
    lineHeight: 20,
  },
  highlightsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  highlightCard: {
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
  highlightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#212529',
    marginTop: 8,
    marginBottom: 4,
  },
  highlightDescription: {
    fontSize: 12,
    color: '#6c757d',
    textAlign: 'center',
    lineHeight: 16,
  },
  techInfoContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  techInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f9fa',
  },
  techInfoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
  },
  techInfoValue: {
    fontSize: 14,
    color: '#212529',
    textAlign: 'right',
    flex: 1,
    marginLeft: 16,
  },
});