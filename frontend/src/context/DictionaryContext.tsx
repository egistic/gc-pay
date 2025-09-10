import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { 
  DictionaryType, 
  DictionaryItem, 
  DictionaryState, 
  FilterState,
  PaginationState,
  DictionaryStatistics
} from '../types/dictionaries';

/**
 * Dictionary Context State
 */
interface DictionaryContextState {
  currentDictionary: DictionaryType;
  dictionaries: {
    [K in DictionaryType]: {
      items: DictionaryItem[];
      statistics: DictionaryStatistics | null;
      state: DictionaryState;
    };
  };
  globalState: {
    isLoading: boolean;
    error: string | null;
    lastUpdated: string | null;
  };
}

/**
 * Dictionary Context Actions
 */
type DictionaryContextAction =
  | { type: 'SET_CURRENT_DICTIONARY'; payload: DictionaryType }
  | { type: 'SET_ITEMS'; payload: { type: DictionaryType; items: DictionaryItem[] } }
  | { type: 'SET_STATISTICS'; payload: { type: DictionaryType; statistics: DictionaryStatistics } }
  | { type: 'SET_STATE'; payload: { type: DictionaryType; state: Partial<DictionaryState> } }
  | { type: 'ADD_ITEM'; payload: { type: DictionaryType; item: DictionaryItem } }
  | { type: 'UPDATE_ITEM'; payload: { type: DictionaryType; id: string; item: Partial<DictionaryItem> } }
  | { type: 'DELETE_ITEM'; payload: { type: DictionaryType; id: string } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET_DICTIONARY'; payload: DictionaryType };

/**
 * Dictionary Context
 */
interface DictionaryContextType {
  state: DictionaryContextState;
  dispatch: React.Dispatch<DictionaryContextAction>;
  getDictionaryState: (type: DictionaryType) => DictionaryState;
  getDictionaryItems: (type: DictionaryType) => DictionaryItem[];
  getDictionaryStatistics: (type: DictionaryType) => DictionaryStatistics | null;
  setCurrentDictionary: (type: DictionaryType) => void;
  setItems: (type: DictionaryType, items: DictionaryItem[]) => void;
  setStatistics: (type: DictionaryType, statistics: DictionaryStatistics) => void;
  updateDictionaryState: (type: DictionaryType, state: Partial<DictionaryState>) => void;
  addItem: (type: DictionaryType, item: DictionaryItem) => void;
  updateItem: (type: DictionaryType, id: string, item: Partial<DictionaryItem>) => void;
  deleteItem: (type: DictionaryType, id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  resetDictionary: (type: DictionaryType) => void;
}

/**
 * Initial state
 */
const initialState: DictionaryContextState = {
  currentDictionary: 'expense-articles',
  dictionaries: {
    'expense-articles': {
      items: [],
      statistics: null,
      state: {
        currentDictionary: 'expense-articles',
        selectedItems: [],
        searchQuery: '',
        filters: {},
        pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
        editingItem: null,
        bulkActionMode: false,
        relatedData: {},
        isLoading: false,
        error: null
      }
    },
    'counterparties': {
      items: [],
      statistics: null,
      state: {
        currentDictionary: 'counterparties',
        selectedItems: [],
        searchQuery: '',
        filters: {},
        pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
        editingItem: null,
        bulkActionMode: false,
        relatedData: {},
        isLoading: false,
        error: null
      }
    },
    'contracts': {
      items: [],
      statistics: null,
      state: {
        currentDictionary: 'contracts',
        selectedItems: [],
        searchQuery: '',
        filters: {},
        pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
        editingItem: null,
        bulkActionMode: false,
        relatedData: {},
        isLoading: false,
        error: null
      }
    },
    'normatives': {
      items: [],
      statistics: null,
      state: {
        currentDictionary: 'normatives',
        selectedItems: [],
        searchQuery: '',
        filters: {},
        pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
        editingItem: null,
        bulkActionMode: false,
        relatedData: {},
        isLoading: false,
        error: null
      }
    },
    'priorities': {
      items: [],
      statistics: null,
      state: {
        currentDictionary: 'priorities',
        selectedItems: [],
        searchQuery: '',
        filters: {},
        pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
        editingItem: null,
        bulkActionMode: false,
        relatedData: {},
        isLoading: false,
        error: null
      }
    },
    'users': {
      items: [],
      statistics: null,
      state: {
        currentDictionary: 'users',
        selectedItems: [],
        searchQuery: '',
        filters: {},
        pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
        editingItem: null,
        bulkActionMode: false,
        relatedData: {},
        isLoading: false,
        error: null
      }
    }
  },
  globalState: {
    isLoading: false,
    error: null,
    lastUpdated: null
  }
};

/**
 * Reducer function
 */
function dictionaryReducer(state: DictionaryContextState, action: DictionaryContextAction): DictionaryContextState {
  switch (action.type) {
    case 'SET_CURRENT_DICTIONARY':
      return {
        ...state,
        currentDictionary: action.payload
      };

    case 'SET_ITEMS':
      return {
        ...state,
        dictionaries: {
          ...state.dictionaries,
          [action.payload.type]: {
            ...state.dictionaries[action.payload.type],
            items: action.payload.items
          }
        },
        globalState: {
          ...state.globalState,
          lastUpdated: new Date().toISOString()
        }
      };

    case 'SET_STATISTICS':
      return {
        ...state,
        dictionaries: {
          ...state.dictionaries,
          [action.payload.type]: {
            ...state.dictionaries[action.payload.type],
            statistics: action.payload.statistics
          }
        }
      };

    case 'SET_STATE':
      return {
        ...state,
        dictionaries: {
          ...state.dictionaries,
          [action.payload.type]: {
            ...state.dictionaries[action.payload.type],
            state: {
              ...state.dictionaries[action.payload.type].state,
              ...action.payload.state
            }
          }
        }
      };

    case 'ADD_ITEM':
      return {
        ...state,
        dictionaries: {
          ...state.dictionaries,
          [action.payload.type]: {
            ...state.dictionaries[action.payload.type],
            items: [...state.dictionaries[action.payload.type].items, action.payload.item]
          }
        },
        globalState: {
          ...state.globalState,
          lastUpdated: new Date().toISOString()
        }
      };

    case 'UPDATE_ITEM':
      return {
        ...state,
        dictionaries: {
          ...state.dictionaries,
          [action.payload.type]: {
            ...state.dictionaries[action.payload.type],
            items: state.dictionaries[action.payload.type].items.map(item =>
              item.id === action.payload.id
                ? { ...item, ...action.payload.item }
                : item
            )
          }
        },
        globalState: {
          ...state.globalState,
          lastUpdated: new Date().toISOString()
        }
      };

    case 'DELETE_ITEM':
      return {
        ...state,
        dictionaries: {
          ...state.dictionaries,
          [action.payload.type]: {
            ...state.dictionaries[action.payload.type],
            items: state.dictionaries[action.payload.type].items.filter(
              item => item.id !== action.payload.id
            )
          }
        },
        globalState: {
          ...state.globalState,
          lastUpdated: new Date().toISOString()
        }
      };

    case 'SET_LOADING':
      return {
        ...state,
        globalState: {
          ...state.globalState,
          isLoading: action.payload
        }
      };

    case 'SET_ERROR':
      return {
        ...state,
        globalState: {
          ...state.globalState,
          error: action.payload
        }
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        globalState: {
          ...state.globalState,
          error: null
        }
      };

    case 'RESET_DICTIONARY':
      return {
        ...state,
        dictionaries: {
          ...state.dictionaries,
          [action.payload]: {
            items: [],
            statistics: null,
            state: {
              currentDictionary: action.payload,
              selectedItems: [],
              searchQuery: '',
              filters: {},
              pagination: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
              editingItem: null,
              bulkActionMode: false,
              relatedData: {},
              isLoading: false,
              error: null
            }
          }
        }
      };

    default:
      return state;
  }
}

/**
 * Create context
 */
const DictionaryContext = createContext<DictionaryContextType | undefined>(undefined);

/**
 * Dictionary Provider component
 */
interface DictionaryProviderProps {
  children: ReactNode;
}

export function DictionaryProvider({ children }: DictionaryProviderProps) {
  const [state, dispatch] = useReducer(dictionaryReducer, initialState);

  // Helper functions
  const getDictionaryState = (type: DictionaryType): DictionaryState => {
    return state.dictionaries[type].state;
  };

  const getDictionaryItems = (type: DictionaryType): DictionaryItem[] => {
    return state.dictionaries[type].items;
  };

  const getDictionaryStatistics = (type: DictionaryType): DictionaryStatistics | null => {
    return state.dictionaries[type].statistics;
  };

  const setCurrentDictionary = (type: DictionaryType) => {
    dispatch({ type: 'SET_CURRENT_DICTIONARY', payload: type });
  };

  const setItems = (type: DictionaryType, items: DictionaryItem[]) => {
    dispatch({ type: 'SET_ITEMS', payload: { type, items } });
  };

  const setStatistics = (type: DictionaryType, statistics: DictionaryStatistics) => {
    dispatch({ type: 'SET_STATISTICS', payload: { type, statistics } });
  };

  const updateDictionaryState = (type: DictionaryType, state: Partial<DictionaryState>) => {
    dispatch({ type: 'SET_STATE', payload: { type, state } });
  };

  const addItem = (type: DictionaryType, item: DictionaryItem) => {
    dispatch({ type: 'ADD_ITEM', payload: { type, item } });
  };

  const updateItem = (type: DictionaryType, id: string, item: Partial<DictionaryItem>) => {
    dispatch({ type: 'UPDATE_ITEM', payload: { type, id, item } });
  };

  const deleteItem = (type: DictionaryType, id: string) => {
    dispatch({ type: 'DELETE_ITEM', payload: { type, id } });
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setError = (error: string | null) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const resetDictionary = (type: DictionaryType) => {
    dispatch({ type: 'RESET_DICTIONARY', payload: type });
  };

  const contextValue: DictionaryContextType = {
    state,
    dispatch,
    getDictionaryState,
    getDictionaryItems,
    getDictionaryStatistics,
    setCurrentDictionary,
    setItems,
    setStatistics,
    updateDictionaryState,
    addItem,
    updateItem,
    deleteItem,
    setLoading,
    setError,
    clearError,
    resetDictionary
  };

  return (
    <DictionaryContext.Provider value={contextValue}>
      {children}
    </DictionaryContext.Provider>
  );
}

/**
 * Hook to use dictionary context
 */
export function useDictionaryContext(): DictionaryContextType {
  const context = useContext(DictionaryContext);
  if (context === undefined) {
    throw new Error('useDictionaryContext must be used within a DictionaryProvider');
  }
  return context;
}

/**
 * Hook to use specific dictionary
 */
export function useDictionary(type: DictionaryType) {
  const context = useDictionaryContext();
  
  return {
    items: context.getDictionaryItems(type),
    statistics: context.getDictionaryStatistics(type),
    state: context.getDictionaryState(type),
    setItems: (items: DictionaryItem[]) => context.setItems(type, items),
    setStatistics: (statistics: DictionaryStatistics) => context.setStatistics(type, statistics),
    updateState: (state: Partial<DictionaryState>) => context.updateDictionaryState(type, state),
    addItem: (item: DictionaryItem) => context.addItem(type, item),
    updateItem: (id: string, item: Partial<DictionaryItem>) => context.updateItem(type, id, item),
    deleteItem: (id: string) => context.deleteItem(type, id),
    reset: () => context.resetDictionary(type)
  };
}
