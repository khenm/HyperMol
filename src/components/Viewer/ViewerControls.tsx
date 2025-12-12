import React, { useState } from 'react';
import { Layout, Input, Upload, Select, Typography, Divider, Card, Tag, Button, Radio, App as AntdApp } from 'antd';
import { InboxOutlined, SearchOutlined, BgColorsOutlined, CameraOutlined, ExperimentOutlined, PlayCircleOutlined, PauseCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import { useMolstar } from '../../context/MolContext';
import { 
    loadPdbId, loadLocalFile, updateRepresentation, applyColor, takeSnapshot,
    playTrajectory, pauseTrajectory, getTrajectoryInfo,
    setSelectionGranularity, measureAtoms, clearMeasurements, cloneLoci,
    type RepresentationType, type ColorStyle
} from '../../utils/molstarHelpers';
import { StructureElement } from 'molstar/lib/mol-model/structure';
import { OrderedSet } from 'molstar/lib/mol-data/int';
import { fetchPdbMetadata } from '../../services/rcsbApi';
import type { PdbMetadata } from '../../types/pdb';
import type { UploadProps } from 'antd';

const { Sider } = Layout;
const { Title, Text } = Typography;
const { Dragger } = Upload;
const { Option } = Select;

export const ViewerControls: React.FC = () => {
    const { plugin } = useMolstar();
    const { message } = AntdApp.useApp();
    const [collapsed, setCollapsed] = useState(false);
    const [loading, setLoading] = useState(false);
    const [metadata, setMetadata] = useState<PdbMetadata | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [frameCount, setFrameCount] = useState(0);
    const [selectionMode, setSelectionMode] = useState<'residue' | 'element'>('residue');
    const [measureMode, setMeasureMode] = useState<'none' | 'distance' | 'angle' | 'dihedral'>('none');
    const [measurePoints, setMeasurePoints] = useState<StructureElement.Loci[]>([]);
    const pointsRef = React.useRef<StructureElement.Loci[]>([]);

    // Subscribe to clicks for measurement
    React.useEffect(() => {
        if (!plugin || measureMode === 'none') return;

        // Reset points when entering mode
        pointsRef.current = [];
        setMeasurePoints([]);

        // Force Element (Atom) granularity for precise measurement
        setSelectionGranularity(plugin, 'element');

        const sub = plugin.behaviors.interaction.click.subscribe((e) => {
            if (e.current?.loci && e.current.loci.kind === 'element-loci') {
                const loci = e.current.loci as StructureElement.Loci;
                // Optional Chain & Simplify
                if (!StructureElement.Loci.isEmpty(loci)) {
                    // Start of fix for multi-atom selection issue
                    if (StructureElement.Loci.size(loci) !== 1) {
                         // Only warn if we actually clicked something valid but wrong size
                         // (Empty clicks are ignored above)
                         message.warning('Please click exactly one atom');
                         return;
                    }

                    // Prevent double-clicking the same atom (Debounce/Safety)
                    if (pointsRef.current.length > 0) {
                        const last = pointsRef.current[pointsRef.current.length - 1];
                        if (StructureElement.Loci.areEqual(last, loci)) {
                            console.log('[HyperMol] Duplicate click detected, ignoring');
                            return; // Ignore duplicate click
                        }
                    }

                    console.log('[HyperMol] Clicked Loci:', loci);
                    // Log details of the atom
                    const e = loci.elements[0];
                    console.log('[HyperMol] Atom Unit:', e.unit.id, 'Index:', OrderedSet.start(e.indices));

                    // Attempt to remap to root structure to ensure context stability
                    let capturedLoci = loci;
                    const structures = plugin.managers.structure.hierarchy.current.structures;
                    for (const s of structures) {
                        const root = s.cell.obj?.data;
                        if (root) {
                             const remapped = StructureElement.Loci.remap(loci, root);
                             if (!StructureElement.Loci.isEmpty(remapped)) {
                                 capturedLoci = remapped;
                                 console.log('[HyperMol] Remapped Loci to Root Structure');
                                 break;
                             }
                        }
                    }

                    // CLONE the loci to prevent object pooling issues (The "Wrong Atom" Fix)
                    const clonedLoci = cloneLoci(capturedLoci);

                    const newPoints = [...pointsRef.current, clonedLoci];
                    pointsRef.current = newPoints;
                    console.log('[HyperMol] Current Points:', newPoints.length);
                    
                    let required = 2;
                    if (measureMode === 'angle') required = 3;
                    else if (measureMode === 'dihedral') required = 4;

                    if (newPoints.length === required) {
                        // Perform measurement
                        measureAtoms(plugin, newPoints, measureMode).then(msg => message.success(msg));
                        setMeasureMode('none');
                        setMeasurePoints([]);
                        pointsRef.current = [];
                    } else {
                        message.info(`Selected ${newPoints.length}/${required}`);
                        setMeasurePoints(newPoints);
                    }
                }
            }
        });

        return () => {
            sub.unsubscribe();
            // Restore user preference
            if (plugin) setSelectionGranularity(plugin, selectionMode);
        };
    }, [plugin, measureMode, message, selectionMode]); // Removed measurePoints dependency

    // ... (Keep existing onSearch and uploadProps logic from Phase 3) ...
    const onSearch = async (value: string) => {
        if (!plugin || !value) return;
        setLoading(true);
        setMetadata(null);
        try {
            await Promise.all([
                loadPdbId(plugin, value),
                fetchPdbMetadata(value).then(setMetadata)
            ]);
            
            // Check for trajectory frames
            const info = getTrajectoryInfo(plugin);
            if (info) setFrameCount(info.size);
            else setFrameCount(0);

            message.success(`Loaded ${value.toUpperCase()}`);
        } catch (error) { 
            console.error(error);
            message.error('Failed to load.'); 
        } 
        finally { setLoading(false); }
    };

    const uploadProps: UploadProps = {
        name: 'file', multiple: false, showUploadList: false,
        beforeUpload: (file) => {
            if(plugin) {
                 loadLocalFile(plugin, file as File).then(() => {
                     const info = getTrajectoryInfo(plugin);
                     if (info) setFrameCount(info.size);
                     else setFrameCount(0);
                     message.success('Loaded File');
                 });
            }
            return false;
        }
    };

    // STYLES
    const sectionTitleStyle = { color: '#8A8680', fontSize: '11px', fontWeight: 600, textTransform: 'uppercase' as const, letterSpacing: '0.5px' };
    const iconStyle = { color: '#DA7756' }; // Terracotta icon color

    return (
        <Sider 
            collapsible 
            collapsed={collapsed} 
            onCollapse={setCollapsed}
            width={340}
            // Removed theme="dark" to allow our pastel override
            style={{ 
                background: '#EBE8E2', // Darker Beige Sidebar
                borderRight: '1px solid #E0DDD5',
                overflowY: 'auto', 
                height: '100vh'
            }}
            trigger={null} // We can build a custom trigger if needed, or rely on default
        >
            <div style={{ padding: '24px', display: collapsed ? 'none' : 'block' }}>
                <div style={{ marginBottom: '24px' }}>
                    <Title level={3} style={{ color: '#45423C', margin: 0, fontFamily: 'serif' }}>HyperMol</Title>
                    <Text style={{ color: '#8A8680', fontSize: '13px' }}>WebGL2 Accelerated Viewer</Text>
                </div>

                {/* SEARCH */}
                <Text style={sectionTitleStyle}>Data Source</Text>
                <Input.Search
                    placeholder="PDB ID (e.g. 1BNA)"
                    allowClear
                    enterButton={<Button type="primary" icon={<SearchOutlined />} />}
                    onSearch={onSearch}
                    loading={loading}
                    size="large"
                    style={{ marginTop: '8px', marginBottom: '16px' }}
                    variant="filled" // Cleaner look
                />

                <Dragger {...uploadProps} style={{ background: '#F7F5F3', borderColor: '#E0DDD5', borderRadius: '12px' }}>
                    <p className="ant-upload-drag-icon">
                        <InboxOutlined style={{ color: '#DA7756', fontSize: '28px' }} />
                    </p>
                    <p className="ant-upload-text" style={{ color: '#666', fontSize: '13px' }}>
                        Drag local .bcif / .pdb
                    </p>
                </Dragger>

                {/* METADATA */}
                {metadata && (
                    <Card 
                        size="small"
                        variant="borderless"
                        style={{ marginTop: '20px', background: '#FFF', boxShadow: '0 4px 12px rgba(0,0,0,0.02)' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <Text strong style={{ fontSize: '16px', color: '#DA7756' }}>{metadata.id}</Text>
                            <Tag color="orange">{metadata.resolution}</Tag>
                        </div>
                        <Text style={{ color: '#444', fontSize: '13px', lineHeight: 1.4, display: 'block' }}>{metadata.title}</Text>
                        <div style={{ marginTop: '12px', fontSize: '12px', color: '#999' }}>
                            <ExperimentOutlined /> {metadata.organism}
                        </div>
                    </Card>
                )}

                <Divider style={{ borderColor: '#D6D3CD' }} />

                {/* CONTROLS */}
                <Text style={sectionTitleStyle}>Representation</Text>
                
                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <Select 
                        defaultValue="cartoon" 
                        variant="borderless"
                        style={{ background: '#FFF', borderRadius: '8px', padding: '4px' }}
                        onChange={(val) => updateRepresentation(plugin!, val as RepresentationType)}
                    >
                        <Option value="cartoon">Cartoon</Option>
                        <Option value="ball-stick">Ball & Stick</Option>
                        <Option value="molecular-surface">Soft Surface</Option>
                    </Select>

                    <Select 
                        defaultValue="chain-id" 
                        variant="borderless"
                        style={{ background: '#FFF', borderRadius: '8px', padding: '4px' }}
                        onChange={(val) => applyColor(plugin!, val as ColorStyle)}
                        suffixIcon={<BgColorsOutlined style={iconStyle}/>}
                    >
                        <Option value="chain-id">By Chain</Option>
                        <Option value="element-symbol">By Element</Option>
                        <Option value="rainbow">Rainbow Gradient</Option>
                        <Option value="hydrophobicity">Hydrophobicity</Option>
                    </Select>
                </div>

                <Divider style={{ borderColor: '#D6D3CD' }} />

                {/* TRAJECTORY */}
                <Text style={sectionTitleStyle}>Sequence Playback</Text>
                
                {frameCount > 1 && (
                    <div style={{ marginBottom: '8px' }}>
                        <Tag color="geekblue">{frameCount} Frames</Tag>
                    </div>
                )}

                <div style={{ marginTop: '12px', marginBottom: '16px' }}>
                     <Button 
                        block
                        icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
                        onClick={async () => {
                            if (!plugin) return;
                            if (isPlaying) {
                                await pauseTrajectory(plugin);
                                setIsPlaying(false);
                            } else {
                                await playTrajectory(plugin);
                                setIsPlaying(true);
                            }
                        }}
                        style={{ 
                            background: isPlaying ? '#FDF3F0' : '#FFF', 
                            borderColor: isPlaying ? '#DA7756' : '#E0DDD5', 
                            color: isPlaying ? '#DA7756' : '#666' 
                        }}
                    >
                        {isPlaying ? 'Pause Simulation' : 'Play Simulation'}
                    </Button>
                </div>

                <Divider style={{ borderColor: '#D6D3CD' }} />

                {/* MEASUREMENTS (PLAYGROUND) */}
                <Text style={sectionTitleStyle}>Measurements (Playground)</Text>
                
                <div style={{ marginTop: '12px', marginBottom: '12px' }}>
                    <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <Text style={{ fontSize: '12px', color: '#666' }}>Selection Mode:</Text>
                         <Radio.Group 
                            size="small" 
                            value={selectionMode}
                            onChange={(e) => {
                                setSelectionMode(e.target.value);
                                if (plugin) setSelectionGranularity(plugin, e.target.value);
                            }}
                            buttonStyle="solid"
                        >
                            <Radio.Button value="residue">Residue</Radio.Button>
                            <Radio.Button value="element">Atom</Radio.Button>
                        </Radio.Group>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '4px' }}>
                        <Button 
                            size="small" 
                            type={measureMode === 'distance' ? 'primary' : 'default'}
                            onClick={() => {
                                setMeasureMode('distance');
                                setMeasurePoints([]);
                                message.info('Click 2 atoms');
                            }}
                        >
                            Dist (2)
                        </Button>
                        <Button 
                            size="small" 
                            type={measureMode === 'angle' ? 'primary' : 'default'}
                            onClick={() => {
                                setMeasureMode('angle');
                                setMeasurePoints([]);
                                message.info('Click 3 atoms');
                            }}
                        >
                            Angle (3)
                        </Button>
                        <Button 
                            size="small" 
                            type={measureMode === 'dihedral' ? 'primary' : 'default'}
                            onClick={() => {
                                setMeasureMode('dihedral');
                                setMeasurePoints([]);
                                message.info('Click 4 atoms');
                            }}
                        >
                            Torsion (4)
                        </Button>
                    </div>

                    {measureMode !== 'none' && (
                        <div style={{ marginTop: '8px', textAlign: 'center' }}>
                            <Tag color="processing">
                                Selecting: {measurePoints.length} / {measureMode === 'distance' ? 2 : measureMode === 'angle' ? 3 : 4}
                            </Tag>
                            <Button 
                                type="text" 
                                size="small" 
                                danger
                                onClick={() => {
                                    setMeasureMode('none');
                                    setMeasurePoints([]);
                                }}
                            >
                                Cancel
                            </Button>
                        </div>
                    )}

                    <Button 
                        block 
                        size="small" 
                        danger 
                        icon={<DeleteOutlined />} 
                        style={{ marginTop: '8px' }}
                        onClick={() => plugin && clearMeasurements(plugin)}
                    >
                        Clear Measurements
                    </Button>
                </div>

                <Divider style={{ borderColor: '#D6D3CD' }} />

                <Button 
                    block 
                    size="large"
                    icon={<CameraOutlined />} 
                    style={{ 
                        background: '#FFF', 
                        borderColor: '#E0DDD5', 
                        color: '#666',
                        height: '48px'
                    }}
                    onClick={() => takeSnapshot(plugin!)}
                >
                    Capture High-Res
                </Button>
            </div>
        </Sider>
    );
};