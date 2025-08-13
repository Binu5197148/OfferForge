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
const { width } = Dimensions.get('window');

interface AutoDemoStep {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  enabled: boolean;
  completed: boolean;
  loading: boolean;
  result?: any;
  error?: string;
}

interface ProjectBrief {
  niche: string;
  promise: string;
  targetPrice: number;
  currency: string;
  avatarName: string;
  ageRange: string;
  painPoints: string;
  reviews: string;
  faqs: string;
}

export default function AutoDemo() {
  const router = useRouter();
  const [currentScreen, setCurrentScreen] = useState<'config' | 'progress' | 'complete'>('config');
  const [demoProject, setDemoProject] = useState<any>(null);
  const [projectBrief, setProjectBrief] = useState<ProjectBrief>({
    niche: 'Marketing Digital',
    promise: 'Transforme seu negócio em uma máquina de vendas online e fature R$ 30.000/mês em até 90 dias',
    targetPrice: 997,
    currency: 'BRL',
    avatarName: 'Empreendedor Digital',
    ageRange: '28-45 anos',
    painPoints: `Não consegue gerar leads qualificados
Gasta dinheiro em anúncios sem retorno
Não sabe criar funis de vendas eficazes
Perde vendas por não ter follow-up adequado`,
    reviews: `Preciso de algo que realmente funcione, não mais teoria
Já tentei vários métodos mas nenhum trouxe resultado prático
Quero algo que me ensine passo a passo como implementar`,
    faqs: `Funciona para iniciantes no marketing digital?
Preciso investir muito dinheiro em anúncios?
Em quanto tempo posso ver os primeiros resultados?`
  });

  const [autoSteps, setAutoSteps] = useState<AutoDemoStep[]>([
    {
      id: 'project',
      title: 'Criar Projeto',
      description: 'Criar projeto com brief completo',
      icon: 'document-text',
      color: '#007AFF',
      enabled: true,
      completed: false,
      loading: false
    },
    {
      id: 'offer',
      title: 'Gerar Oferta IA',
      description: 'GPT-4 cria headline, provas, bônus e garantias',
      icon: 'sparkles',
      color: '#ffc107',
      enabled: true,
      completed: false,
      loading: false
    },
    {
      id: 'materials',
      title: 'Gerar Materiais',
      description: 'VSL script, 5 e-mails e posts sociais',
      icon: 'folder',
      color: '#fd7e14',
      enabled: true,
      completed: false,
      loading: false
    },
    {
      id: 'landing',
      title: 'Landing Page',
      description: 'Template mobile-first responsivo',
      icon: 'globe',
      color: '#6f42c1',
      enabled: true,
      completed: false,
      loading: false
    },
    {
      id: 'export',
      title: 'Exportar Tudo',
      description: 'ZIP, PDF e HTML prontos para deploy',
      icon: 'download',
      color: '#28a745',
      enabled: true,
      completed: false,
      loading: false
    }
  ]);

  const [overallProgress, setOverallProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const enabledSteps = autoSteps.filter(step => step.enabled);
    const completedSteps = enabledSteps.filter(step => step.completed);
    const progress = enabledSteps.length > 0 ? (completedSteps.length / enabledSteps.length) * 100 : 0;
    setOverallProgress(progress);
  }, [autoSteps]);

  const toggleStep = (stepId: string) => {
    if (isRunning) return;
    
    setAutoSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, enabled: !step.enabled } : step
    ));
  };

  const startAutomatedProcess = async () => {
    // ✅ NAVEGAÇÃO AUTOMÁTICA PARA TELA DE PROGRESSO
    setCurrentScreen('progress');
    setIsRunning(true);
    
    const enabledSteps = autoSteps.filter(step => step.enabled);
    
    try {
      for (let i = 0; i < enabledSteps.length; i++) {
        const step = enabledSteps[i];
        setCurrentStepIndex(i);
        
        // Atualizar estado para "loading"
        setAutoSteps(prev => prev.map(s => 
          s.id === step.id 
            ? { ...s, loading: true, error: undefined }
            : s
        ));

        let result;
        
        try {
          switch (step.id) {
            case 'project':
              result = await createProject();
              break;
            case 'offer':
              result = await generateOffer();
              break;
            case 'materials':
              result = await generateMaterials();
              break;
            case 'landing':
              result = await generateLandingPage();
              break;
            case 'export':
              result = await exportAll();
              break;
          }

          // Sucesso - marcar como completo
          setAutoSteps(prev => prev.map(s => 
            s.id === step.id 
              ? { ...s, loading: false, completed: true, result }
              : s
          ));

          // Delay visual para ver o progresso
          await new Promise(resolve => setTimeout(resolve, 1500));

        } catch (error) {
          console.error(`Error in step ${step.id}:`, error);
          
          // Marcar como erro
          setAutoSteps(prev => prev.map(s => 
            s.id === step.id 
              ? { ...s, loading: false, error: error.message }
              : s
          ));

          Alert.alert(
            'Erro na Automação',
            `Falha na etapa "${step.title}": ${error.message}`,
            [
              { text: 'Continuar', onPress: () => {} },
              { text: 'Parar', onPress: () => setIsRunning(false) }
            ]
          );
          break;
        }
      }

      // Processo completo
      if (overallProgress === 100) {
        setCurrentScreen('complete');
      }

    } finally {
      setIsRunning(false);
    }
  };

  // API Functions
  const createProject = async () => {
    // Criar projeto
    const projectData = {
      name: `AutoDemo: ${projectBrief.niche}`,
      user_id: 'auto-demo',
      language: 'pt-BR'
    };

    const projectResponse = await fetch(`${BACKEND_URL}/api/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData)
    });

    if (!projectResponse.ok) throw new Error('Falha ao criar projeto');
    const project = await projectResponse.json();

    // Adicionar brief e pain research
    const briefData = {
      niche: projectBrief.niche,
      avatar_id: 'auto-demo-avatar',
      promise: projectBrief.promise,
      target_price: projectBrief.targetPrice,
      currency: projectBrief.currency,
      additional_notes: `Avatar: ${projectBrief.avatarName} (${projectBrief.ageRange})`
    };

    const painResearchData = {
      pain_points: projectBrief.painPoints.split('\n').filter(p => p.trim()).map(p => ({
        description: p.trim(),
        frequency: 3,
        source: 'auto-demo',
        category: 'marketing'
      })),
      reviews: projectBrief.reviews.split('\n').filter(r => r.trim()),
      faqs: projectBrief.faqs.split('\n').filter(f => f.trim()),
      manual_input: projectBrief.painPoints
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
    
    return {
      name: updatedProject.name,
      id: updatedProject._id,
      status: updatedProject.status
    };
  };

  const generateOffer = async () => {
    if (!demoProject) throw new Error('Projeto não encontrado');

    const response = await fetch(`${BACKEND_URL}/api/generate/offer/${demoProject._id}`, {
      method: 'POST'
    });

    if (!response.ok) throw new Error('Falha ao gerar oferta');
    const result = await response.json();
    
    if (!result.success) throw new Error('IA falhou ao gerar oferta');
    
    return {
      headline: result.offer.headline,
      bonuses: result.offer.bonuses?.length || 0,
      guarantees: result.offer.guarantees?.length || 0
    };
  };

  const generateMaterials = async () => {
    if (!demoProject) throw new Error('Projeto não encontrado');

    const response = await fetch(`${BACKEND_URL}/api/generate/materials/${demoProject._id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(['vsl', 'emails', 'social'])
    });

    if (!response.ok) throw new Error('Falha ao gerar materiais');
    const result = await response.json();
    
    if (!result.success) throw new Error('IA falhou ao gerar materiais');
    
    return {
      vsl: result.materials.vsl_script ? 'Gerado' : 'Erro',
      emails: result.materials.email_sequence?.emails?.length || 0,
      social: result.materials.social_content?.length || 0
    };
  };

  const generateLandingPage = async () => {
    if (!demoProject) throw new Error('Projeto não encontrado');

    const response = await fetch(`${BACKEND_URL}/api/generate/landing-page/${demoProject._id}`, {
      method: 'POST'
    });

    if (!response.ok) throw new Error('Falha ao gerar landing page');
    const result = await response.json();
    
    if (!result.success) throw new Error('IA falhou ao gerar landing page');
    
    return {
      template: result.landing_page.template_name,
      size: `${Math.round(result.landing_page.html_content.length / 1024)} KB`
    };
  };

  const exportAll = async () => {
    if (!demoProject) throw new Error('Projeto não encontrado');

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
  };

  const resetDemo = () => {
    setAutoSteps(prev => prev.map(step => ({
      ...step,
      completed: false,
      loading: false,
      result: undefined,
      error: undefined
    })));
    setCurrentScreen('config');
    setCurrentStepIndex(0);
    setDemoProject(null);
    setIsRunning(false);
  };

  const viewProject = () => {
    if (demoProject) {
      router.push(`/project/${demoProject._id}`);
    }
  };

  // 🎯 TELA DE CONFIGURAÇÃO
  const renderConfigScreen = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🤖 OfferForge Automatizado</Text>
        <Text style={styles.sectionDescription}>
          Selecione as etapas que deseja executar automaticamente. 
          Após clicar "Iniciar", o processo será 100% automático.
        </Text>

        {/* Configuração do Brief */}
        <View style={styles.briefContainer}>
          <Text style={styles.briefTitle}>📋 Brief Configurado:</Text>
          <Text style={styles.briefText}>
            • Nicho: {projectBrief.niche}{'\n'}
            • Preço: {projectBrief.currency} {projectBrief.targetPrice}{'\n'}
            • Avatar: {projectBrief.avatarName} ({projectBrief.ageRange})
          </Text>
        </View>

        {/* Seleção de Etapas */}
        <Text style={styles.stepsTitle}>🎯 Etapas do Processo:</Text>
        
        {autoSteps.map((step, index) => (
          <TouchableOpacity 
            key={step.id}
            style={[
              styles.stepConfigCard,
              step.enabled && styles.stepConfigCardEnabled
            ]}
            onPress={() => toggleStep(step.id)}
            disabled={isRunning}
          >
            <View style={styles.stepConfigHeader}>
              <View style={[styles.stepConfigIcon, { backgroundColor: step.color }]}>
                <Ionicons name={step.icon as any} size={20} color="white" />
              </View>
              
              <View style={styles.stepConfigInfo}>
                <Text style={styles.stepConfigTitle}>{step.title}</Text>
                <Text style={styles.stepConfigDescription}>{step.description}</Text>
              </View>
              
              <View style={styles.stepConfigToggle}>
                <Ionicons 
                  name={step.enabled ? "checkmark-circle" : "ellipse-outline"} 
                  size={24} 
                  color={step.enabled ? step.color : '#6c757d'} 
                />
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* Botão Iniciar */}
        <TouchableOpacity 
          style={[styles.startButton, isRunning && styles.startButtonDisabled]}
          onPress={startAutomatedProcess}
          disabled={isRunning || autoSteps.filter(s => s.enabled).length === 0}
        >
          <Ionicons name="rocket" size={24} color="white" />
          <Text style={styles.startButtonText}>
            {isRunning ? 'Executando...' : 'Iniciar Processo Automático'}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  // 🔄 TELA DE PROGRESSO
  const renderProgressScreen = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <Text style={styles.progressTitle}>🤖 Processando OfferForge...</Text>
        <Text style={styles.progressDescription}>
          Aguarde enquanto a IA trabalha para você
        </Text>

        {/* Barra de Progresso Geral */}
        <View style={styles.overallProgressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[styles.progressFill, { width: `${overallProgress}%` }]} 
            />
          </View>
          <Text style={styles.progressText}>
            {Math.round(overallProgress)}% Concluído
          </Text>
        </View>

        {/* Steps em Progresso */}
        {autoSteps.filter(step => step.enabled).map((step, index) => (
          <View 
            key={step.id}
            style={[
              styles.progressStepCard,
              step.loading && styles.progressStepCardActive,
              step.completed && styles.progressStepCardCompleted,
              step.error && styles.progressStepCardError
            ]}
          >
            <View style={styles.progressStepHeader}>
              <View style={[styles.progressStepIcon, { backgroundColor: step.color }]}>
                {step.loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : step.error ? (
                  <Ionicons name="close" size={20} color="white" />
                ) : (
                  <Ionicons 
                    name={step.completed ? "checkmark" : step.icon as any} 
                    size={20} 
                    color="white" 
                  />
                )}
              </View>
              
              <View style={styles.progressStepInfo}>
                <Text style={styles.progressStepTitle}>{step.title}</Text>
                <Text style={styles.progressStepDescription}>
                  {step.loading ? 'Processando...' : 
                   step.error ? `Erro: ${step.error}` :
                   step.completed ? 'Concluído ✅' : 
                   'Aguardando...'}
                </Text>
              </View>
              
              {currentStepIndex === index && step.loading && (
                <View style={styles.currentStepIndicator}>
                  <Text style={styles.currentStepText}>Atual</Text>
                </View>
              )}
            </View>

            {/* Resultado */}
            {step.result && (
              <View style={styles.stepResultContainer}>
                {step.id === 'project' && (
                  <Text style={styles.stepResultText}>
                    📋 Projeto "{step.result.name}" criado
                  </Text>
                )}
                {step.id === 'offer' && (
                  <Text style={styles.stepResultText}>
                    🎯 "{step.result.headline}"
                  </Text>
                )}
                {step.id === 'materials' && (
                  <Text style={styles.stepResultText}>
                    📚 VSL + {step.result.emails} e-mails + {step.result.social} posts
                  </Text>
                )}
                {step.id === 'landing' && (
                  <Text style={styles.stepResultText}>
                    🌐 Template {step.result.template} ({step.result.size})
                  </Text>
                )}
                {step.id === 'export' && (
                  <Text style={styles.stepResultText}>
                    📦 {step.result.length} arquivos exportados
                  </Text>
                )}
              </View>
            )}
          </View>
        ))}

        {/* Botões */}
        <View style={styles.progressButtons}>
          {!isRunning && (
            <TouchableOpacity style={styles.resetButton} onPress={resetDemo}>
              <Ionicons name="refresh" size={20} color="#6c757d" />
              <Text style={styles.resetButtonText}>Reiniciar</Text>
            </TouchableOpacity>
          )}
          
          {demoProject && (
            <TouchableOpacity style={styles.viewProjectButton} onPress={viewProject}>
              <Ionicons name="eye" size={20} color="#007AFF" />
              <Text style={styles.viewProjectButtonText}>Ver Projeto</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </ScrollView>
  );

  // ✅ TELA DE CONCLUSÃO
  const renderCompleteScreen = () => (
    <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <View style={styles.completeContainer}>
          <Ionicons name="checkmark-circle" size={80} color="#28a745" />
          <Text style={styles.completeTitle}>🎉 OfferForge Concluído!</Text>
          <Text style={styles.completeDescription}>
            Todos os materiais foram gerados com sucesso usando IA
          </Text>

          {/* Resumo */}
          <View style={styles.completeSummary}>
            {autoSteps.filter(step => step.enabled && step.completed).map(step => (
              <View key={step.id} style={styles.completeSummaryItem}>
                <Ionicons name="checkmark-circle" size={20} color="#28a745" />
                <Text style={styles.completeSummaryText}>{step.title}</Text>
              </View>
            ))}
          </View>

          {/* Ações */}
          <View style={styles.completeActions}>
            <TouchableOpacity style={styles.viewProjectCompleteButton} onPress={viewProject}>
              <Ionicons name="eye" size={24} color="white" />
              <Text style={styles.viewProjectCompleteButtonText}>Ver Projeto Completo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.newDemoButton} onPress={resetDemo}>
              <Ionicons name="refresh" size={20} color="#007AFF" />
              <Text style={styles.newDemoButtonText}>Nova Demonstração</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color="#212529" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {currentScreen === 'config' ? 'Configurar Automação' :
           currentScreen === 'progress' ? 'Executando...' : 
           'Concluído!'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* Conteúdo baseado na tela atual */}
      {currentScreen === 'config' && renderConfigScreen()}
      {currentScreen === 'progress' && renderProgressScreen()}
      {currentScreen === 'complete' && renderCompleteScreen()}
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
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 16,
    color: '#6c757d',
    lineHeight: 22,
    marginBottom: 24,
  },
  briefContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  briefTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  briefText: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 20,
  },
  stepsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 16,
  },
  stepConfigCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  stepConfigCardEnabled: {
    borderColor: '#007AFF',
    backgroundColor: '#f8f9ff',
  },
  stepConfigHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepConfigIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepConfigInfo: {
    flex: 1,
  },
  stepConfigTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  stepConfigDescription: {
    fontSize: 14,
    color: '#6c757d',
    lineHeight: 18,
  },
  stepConfigToggle: {
    marginLeft: 12,
  },
  startButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 24,
  },
  startButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  progressTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
    textAlign: 'center',
  },
  progressDescription: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 24,
  },
  overallProgressContainer: {
    marginBottom: 32,
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
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    textAlign: 'center',
  },
  progressStepCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#e9ecef',
  },
  progressStepCardActive: {
    borderColor: '#007AFF',
    backgroundColor: '#f8f9ff',
  },
  progressStepCardCompleted: {
    borderColor: '#28a745',
    backgroundColor: '#f8fff8',
  },
  progressStepCardError: {
    borderColor: '#dc3545',
    backgroundColor: '#fff8f8',
  },
  progressStepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressStepIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  progressStepInfo: {
    flex: 1,
  },
  progressStepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 4,
  },
  progressStepDescription: {
    fontSize: 14,
    color: '#6c757d',
  },
  currentStepIndicator: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentStepText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  stepResultContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  stepResultText: {
    fontSize: 14,
    color: '#212529',
    lineHeight: 20,
  },
  progressButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#6c757d',
  },
  resetButtonText: {
    color: '#6c757d',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  viewProjectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  viewProjectButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  completeContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  completeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#212529',
    marginTop: 20,
    marginBottom: 12,
    textAlign: 'center',
  },
  completeDescription: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  completeSummary: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 32,
    width: '100%',
  },
  completeSummaryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  completeSummaryText: {
    fontSize: 16,
    color: '#212529',
    fontWeight: '500',
    marginLeft: 12,
  },
  completeActions: {
    width: '100%',
  },
  viewProjectCompleteButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 16,
  },
  viewProjectCompleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  newDemoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  newDemoButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
});