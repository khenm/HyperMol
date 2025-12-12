import React from 'react';
import { ConfigProvider, App as AntdApp } from 'antd';
import { MolContextProvider } from './context/MolContext';
import { MainLayout } from './components/Layout/MainLayout';
import { MolViewer } from './components/Viewer/MolViewer';
import { pastelTheme } from './theme/pastelTheme';
import './index.css';

const App: React.FC = () => {
  return (
    <ConfigProvider theme={pastelTheme}>
      <AntdApp>
        <MolContextProvider>
            <MainLayout>
               <MolViewer />
            </MainLayout>
        </MolContextProvider>
      </AntdApp>
    </ConfigProvider>
  );
};

export default App;