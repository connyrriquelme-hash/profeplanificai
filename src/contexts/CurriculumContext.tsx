import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// 1. Definimos los tipos de datos exactos del MINEDUC
export interface MINEDUC_OA {
  id: string;
  code: string; // ej: "OA 1"
  description: string;
}

export interface MINEDUC_Skill {
  id: string;
  name: string; // ej: "Analizar", "Clasificar"
}

export interface MINEDUC_Indicator {
  id: string;
  oaId: string; // Para relacionarlo con su OA correspondiente
  description: string;
}

interface CurriculumState {
  objectives: MINEDUC_OA[];
  skills: MINEDUC_Skill[];
  indicators: MINEDUC_Indicator[];
  isLoading: boolean;
}

// 2. Creamos el Contexto
const CurriculumContext = createContext<CurriculumState | undefined>(undefined);

// 3. Creamos el Provider que envolverá tus pestañas
export const CurriculumProvider = ({ children }: { children: ReactNode }) => {
  const [data, setData] = useState<CurriculumState>({
    objectives: [],
    skills: [],
    indicators: [],
    isLoading: true,
  });

  useEffect(() => {
    // Aquí simulamos la carga desde tu base de datos o archivo mock (libraryMockData.ts)
    // En producción, esto sería un fetch() a tu API de Cloudflare
    const fetchBancoMINEDUC = async () => {
      try {
        // Simulación de respuesta de BD
        const mockData = {
          objectives: [
            { id: '1', code: 'OA 1', description: 'Explicar el ciclo del agua...' },
            { id: '2', code: 'OA 2', description: 'Describir las características de los océanos...' }
          ],
          skills: [
            { id: 's1', name: 'Observar y preguntar' },
            { id: 's2', name: 'Analizar evidencias' }
          ],
          indicators: [
            { id: 'i1', oaId: '1', description: 'Identifican los estados del agua.' },
            { id: 'i2', oaId: '1', description: 'Dibujan el proceso de evaporación.' }
          ]
        };

        setData({
          objectives: mockData.objectives,
          skills: mockData.skills,
          indicators: mockData.indicators,
          isLoading: false,
        });
      } catch (error) {
        console.error("Error cargando el banco de objetivos:", error);
        setData(prev => ({ ...prev, isLoading: false }));
      }
    };

    fetchBancoMINEDUC();
  }, []);

  return (
    <CurriculumContext.Provider value={data}>
      {children}
    </CurriculumContext.Provider>
  );
};

// 4. Hook personalizado para consumir los datos fácilmente
export const useCurriculum = () => {
  const context = useContext(CurriculumContext);
  if (context === undefined) {
    throw new Error('useCurriculum debe ser usado dentro de un CurriculumProvider');
  }
  return context;
};
