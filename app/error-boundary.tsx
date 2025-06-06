import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import Colors from '@/constants/colors';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // You can also log the error to an error reporting service
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return <ErrorScreen error={this.state.error!} onReset={() => this.setState({ hasError: false, error: null })} />;
    }

    return this.props.children;
  }
}

interface ErrorScreenProps {
  error: Error;
  onReset: () => void;
}

function ErrorScreen({ error, onReset }: ErrorScreenProps) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = () => {
    setExpanded(!expanded);
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Что-то пошло не так</Text>
        
        <Text style={styles.message}>{error.message}</Text>
        
        <TouchableOpacity 
          style={styles.detailsButton} 
          onPress={toggleExpanded}
        >
          <Text style={styles.detailsButtonText}>
            {expanded ? 'Скрыть детали' : 'Показать детали'}
          </Text>
        </TouchableOpacity>
        
        {expanded && error.stack && (
          <ScrollView style={styles.stackContainer}>
            <Text style={styles.stackText}>{error.stack}</Text>
          </ScrollView>
        )}
        
        <TouchableOpacity 
          style={styles.resetButton} 
          onPress={onReset}
        >
          <Text style={styles.resetButtonText}>Попробовать снова</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.dark,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: Colors.background.card,
    borderRadius: 12,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.text.primary,
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 16,
    color: Colors.text.secondary,
    marginBottom: 20,
    textAlign: 'center',
  },
  detailsButton: {
    padding: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  detailsButtonText: {
    color: Colors.primary,
    fontSize: 14,
  },
  stackContainer: {
    maxHeight: 200,
    backgroundColor: Colors.background.surface,
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
  },
  stackText: {
    color: Colors.text.disabled,
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  resetButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
  },
  resetButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});