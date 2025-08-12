import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

interface StepProps {
  title: string;
  description: string;
  children: React.ReactNode;
  onNext: () => void;
  onBack: () => void;
  nextDisabled?: boolean;
  isLastStep?: boolean;
  isFirstStep?: boolean;
}

const Step: React.FC<StepProps> = ({ 
  title, 
  description, 
  children, 
  onNext, 
  onBack, 
  nextDisabled = false,
  isLastStep = false,
  isFirstStep = false 
}) => (
  <View style={styles.stepContainer}>
    <Text style={styles.stepTitle}>{title}</Text>
    <Text style={styles.stepDescription}>{description}</Text>
    <View style={styles.stepContent}>
      {children}
    </View>
    <View style={styles.stepButtons}>
      {!isFirstStep && (
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="chevron-back" size={20} color="#6c757d" />
          <Text style={styles.backButtonText}>Voltar</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity 
        style={[styles.nextButton, nextDisabled && styles.nextButtonDisabled]} 
        onPress={onNext}
        disabled={nextDisabled}
      >
        <Text style={[styles.nextButtonText, nextDisabled && styles.nextButtonTextDisabled]}>
          {isLastStep ? 'Finalizar' : 'Próximo'}
        </Text>
        {!isLastStep && <Ionicons name="chevron-forward" size={20} color="white" />}
      </TouchableOpacity>
    </View>
  </View>
);

export default function CreateProject() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [projectName, setProjectName] = useState('');
  const [language, setLanguage] = useState('pt-BR');
  
  // Product Brief state
  const [niche, setNiche] = useState('');
  const [avatarName, setAvatarName] = useState('');
  const [ageRange, setAgeRange] = useState('');
  const [promise, setPromise] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [currency, setCurrency] = useState('BRL');
  
  // Pain Research state
  const [painPoints, setPainPoints] = useState('');
  const [reviews, setReviews] = useState('');
  const [faqs, setFaqs] = useState('');

  const steps = [
    'Informações Básicas',
    'Brief do Produto', 
    'Avatar/Público-Alvo',
    'Pesquisa de Dor',
    'Revisão Final'
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleCreateProject();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreateProject = async () => {
    setLoading(true);
    
    try {
      // Step 1: Create project
      const projectData = {
        name: projectName,
        user_id: 'demo-user',
        language: language
      };

      const projectResponse = await fetch(`${BACKEND_URL}/api/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      if (!projectResponse.ok) {
        throw new Error('Failed to create project');
      }

      const project = await projectResponse.json();
      const projectId = project._id;

      // Step 2: Update with brief and pain research
      const briefData = {
        niche: niche,
        avatar_id: 'manual_avatar',
        promise: promise,
        target_price: parseFloat(targetPrice),
        currency: currency,
        additional_notes: `Avatar: ${avatarName} (${ageRange})`
      };

      const painResearchData = {
        pain_points: painPoints.split('\n').filter(p => p.trim()).map(p => ({
          description: p.trim(),
          frequency: 1,
          source: "manual",
          category: "user_input"
        })),
        reviews: reviews.split('\n').filter(r => r.trim()),
        faqs: faqs.split('\n').filter(f => f.trim()),
        manual_input: painPoints
      };

      const updateData = {
        brief: briefData,
        pain_research: painResearchData,
        status: 'research_completed'
      };

      const updateResponse = await fetch(`${BACKEND_URL}/api/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!updateResponse.ok) {
        throw new Error('Failed to update project');
      }

      Alert.alert(
        'Sucesso!', 
        'Projeto criado com sucesso! Agora você pode gerar sua oferta.',
        [
          {
            text: 'Ver Projeto',
            onPress: () => router.push(`/project/${projectId}`)
          }
        ]
      );

    } catch (error) {
      console.error('Error creating project:', error);
      Alert.alert('Erro', 'Falha ao criar projeto. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 0:
        return projectName.trim().length > 0;
      case 1:
        return niche.trim().length > 0 && promise.trim().length > 0 && targetPrice.trim().length > 0;
      case 2:
        return avatarName.trim().length > 0 && ageRange.trim().length > 0;
      case 3:
        return painPoints.trim().length > 0;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <Step
            title="Informações Básicas"
            description="Vamos começar configurando as informações básicas do seu projeto"
            onNext={handleNext}
            onBack={handleBack}
            nextDisabled={!isStepValid()}
            isFirstStep={true}
          >
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome do Projeto</Text>
              <TextInput
                style={styles.input}
                value={projectName}
                onChangeText={setProjectName}
                placeholder="Ex: Curso de Marketing Digital"
                placeholderTextColor="#6c757d"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Idioma</Text>
              <View style={styles.languageSelector}>
                <TouchableOpacity
                  style={[styles.languageOption, language === 'pt-BR' && styles.languageOptionActive]}
                  onPress={() => setLanguage('pt-BR')}
                >
                  <Text style={[styles.languageText, language === 'pt-BR' && styles.languageTextActive]}>
                    🇧🇷 Português
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.languageOption, language === 'en-US' && styles.languageOptionActive]}
                  onPress={() => setLanguage('en-US')}
                >
                  <Text style={[styles.languageText, language === 'en-US' && styles.languageTextActive]}>
                    🇺🇸 English
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Step>
        );

      case 1:
        return (
          <Step
            title="Brief do Produto"
            description="Defina o nicho, promessa e preço-alvo do seu produto"
            onNext={handleNext}
            onBack={handleBack}
            nextDisabled={!isStepValid()}
          >
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nicho *</Text>
              <TextInput
                style={styles.input}
                value={niche}
                onChangeText={setNiche}
                placeholder="Ex: Marketing Digital, Fitness, Culinária"
                placeholderTextColor="#6c757d"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Promessa Principal *</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={promise}
                onChangeText={setPromise}
                placeholder="Ex: Aprenda a gerar R$ 10.000/mês com marketing digital em 90 dias"
                placeholderTextColor="#6c757d"
                multiline={true}
                numberOfLines={3}
              />
            </View>

            <View style={styles.row}>
              <View style={[styles.inputGroup, styles.flex1]}>
                <Text style={styles.label}>Preço-Alvo *</Text>
                <TextInput
                  style={styles.input}
                  value={targetPrice}
                  onChangeText={setTargetPrice}
                  placeholder="497"
                  placeholderTextColor="#6c757d"
                  keyboardType="numeric"
                />
              </View>
              <View style={[styles.inputGroup, styles.flex1, styles.marginLeft]}>
                <Text style={styles.label}>Moeda</Text>
                <View style={styles.currencySelector}>
                  <TouchableOpacity
                    style={[styles.currencyOption, currency === 'BRL' && styles.currencyOptionActive]}
                    onPress={() => setCurrency('BRL')}
                  >
                    <Text style={[styles.currencyText, currency === 'BRL' && styles.currencyTextActive]}>
                      BRL
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.currencyOption, currency === 'USD' && styles.currencyOptionActive]}
                    onPress={() => setCurrency('USD')}
                  >
                    <Text style={[styles.currencyText, currency === 'USD' && styles.currencyTextActive]}>
                      USD
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Step>
        );

      case 2:
        return (
          <Step
            title="Avatar/Público-Alvo"
            description="Defina quem é o seu cliente ideal"
            onNext={handleNext}
            onBack={handleBack}
            nextDisabled={!isStepValid()}
          >
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome do Avatar *</Text>
              <TextInput
                style={styles.input}
                value={avatarName}
                onChangeText={setAvatarName}
                placeholder="Ex: Empreendedor Digital Iniciante"
                placeholderTextColor="#6c757d"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Faixa Etária *</Text>
              <TextInput
                style={styles.input}
                value={ageRange}
                onChangeText={setAgeRange}
                placeholder="Ex: 25-45 anos"
                placeholderTextColor="#6c757d"
              />
            </View>

            <View style={styles.tipBox}>
              <Ionicons name="lightbulb" size={20} color="#ffc107" />
              <Text style={styles.tipText}>
                Dica: Seja específico! Quanto mais detalhado o avatar, melhor será a geração de conteúdo.
              </Text>
            </View>
          </Step>
        );

      case 3:
        return (
          <Step
            title="Pesquisa de Dor"
            description="Identifique as principais dores e problemas do seu público"
            onNext={handleNext}
            onBack={handleBack}
            nextDisabled={!isStepValid()}
          >
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Principais Dores (uma por linha) *</Text>
              <TextInput
                style={[styles.input, styles.textAreaLarge]}
                value={painPoints}
                onChangeText={setPainPoints}
                placeholder={`Ex:
Não consegue atrair clientes online
Não sabe por onde começar no marketing digital
Perde muito tempo com estratégias que não funcionam
Tem medo de investir e não ter retorno`}
                placeholderTextColor="#6c757d"
                multiline={true}
                numberOfLines={6}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Reviews/Comentários (opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={reviews}
                onChangeText={setReviews}
                placeholder="Cole aqui reviews de produtos similares ou comentários relevantes"
                placeholderTextColor="#6c757d"
                multiline={true}
                numberOfLines={4}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>FAQs Comuns (opcional)</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={faqs}
                onChangeText={setFaqs}
                placeholder="Perguntas frequentes do seu público (uma por linha)"
                placeholderTextColor="#6c757d"
                multiline={true}
                numberOfLines={4}
              />
            </View>
          </Step>
        );

      case 4:
        return (
          <Step
            title="Revisão Final"
            description="Confirme as informações antes de criar o projeto"
            onNext={handleNext}
            onBack={handleBack}
            isLastStep={true}
          >
            <ScrollView style={styles.reviewContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>📋 Informações Básicas</Text>
                <Text style={styles.reviewItem}>Nome: {projectName}</Text>
                <Text style={styles.reviewItem}>Idioma: {language === 'pt-BR' ? '🇧🇷 Português' : '🇺🇸 English'}</Text>
              </View>

              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>🎯 Brief do Produto</Text>
                <Text style={styles.reviewItem}>Nicho: {niche}</Text>
                <Text style={styles.reviewItem}>Promessa: {promise}</Text>
                <Text style={styles.reviewItem}>Preço: {currency} {targetPrice}</Text>
              </View>

              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>👤 Avatar</Text>
                <Text style={styles.reviewItem}>Nome: {avatarName}</Text>
                <Text style={styles.reviewItem}>Idade: {ageRange}</Text>
              </View>

              <View style={styles.reviewSection}>
                <Text style={styles.reviewSectionTitle}>💔 Pesquisa de Dor</Text>
                <Text style={styles.reviewItem}>
                  Dores identificadas: {painPoints.split('\n').filter(p => p.trim()).length}
                </Text>
                {reviews && <Text style={styles.reviewItem}>Reviews coletados: Sim</Text>}
                {faqs && <Text style={styles.reviewItem}>FAQs coletados: Sim</Text>}
              </View>
            </ScrollView>

            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.loadingText}>Criando projeto...</Text>
              </View>
            )}
          </Step>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <KeyboardAvoidingView 
        style={styles.container} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#212529" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Novo Projeto</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View 
              style={[
                styles.progressFill, 
                { width: `${((currentStep + 1) / steps.length) * 100}%` }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>
            Etapa {currentStep + 1} de {steps.length}: {steps[currentStep]}
          </Text>
        </View>

        {/* Content */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {renderStepContent()}
        </ScrollView>
      </KeyboardAvoidingView>
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
  closeButton: {
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
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e9ecef',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#6c757d',
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    padding: 20,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 24,
    lineHeight: 22,
  },
  stepContent: {
    marginBottom: 24,
  },
  stepButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6c757d',
    marginLeft: 4,
  },
  nextButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    flex: 1,
    marginLeft: 16,
    justifyContent: 'center',
  },
  nextButtonDisabled: {
    backgroundColor: '#e9ecef',
  },
  nextButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  nextButtonTextDisabled: {
    color: '#6c757d',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: 'white',
    color: '#212529',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  textAreaLarge: {
    height: 120,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
  },
  flex1: {
    flex: 1,
  },
  marginLeft: {
    marginLeft: 12,
  },
  languageSelector: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    overflow: 'hidden',
  },
  languageOption: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  languageOptionActive: {
    backgroundColor: '#007AFF',
  },
  languageText: {
    fontSize: 16,
    color: '#212529',
  },
  languageTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  currencySelector: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e9ecef',
    borderRadius: 8,
    overflow: 'hidden',
  },
  currencyOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'white',
    alignItems: 'center',
    minWidth: 60,
  },
  currencyOptionActive: {
    backgroundColor: '#007AFF',
  },
  currencyText: {
    fontSize: 16,
    color: '#212529',
  },
  currencyTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff8e1',
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107',
    padding: 16,
    borderRadius: 8,
    marginTop: 12,
  },
  tipText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: '#8a6900',
    lineHeight: 20,
  },
  reviewContainer: {
    maxHeight: 400,
  },
  reviewSection: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  reviewSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#212529',
    marginBottom: 12,
  },
  reviewItem: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
    lineHeight: 20,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '500',
  },
});