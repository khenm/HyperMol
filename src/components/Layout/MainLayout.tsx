import React from 'react';
import { Layout } from 'antd';
import { ViewerControls } from '../Viewer/ViewerControls';

const { Content } = Layout;

interface MainLayoutProps {
    children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
    return (
        <Layout style={{ minHeight: '100vh' }}>
            {/* The Sidebar */}
            <ViewerControls />
            
            {/* The 3D Viewer Area */}
            <Layout>
                <Content style={{ position: 'relative', background: '#000' }}>
                    {children}
                </Content>
            </Layout>
        </Layout>
    );
};