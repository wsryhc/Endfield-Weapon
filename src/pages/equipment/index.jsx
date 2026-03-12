import React, { useState, useEffect, useMemo } from 'react';
import Taro, { usePageScroll } from '@tarojs/taro'; // [新增] 引入滚动监听
import { View, Text, Input, Image } from '@tarojs/components';
import './index.scss';

// [配置] 装备数据源
const DATA_URL = "https://wsryhc.top/endfield/equip_data.json";
const CACHE_KEY = 'equip_data_cache_v1'; // [新增] 缓存键名

export default function Equipment() {
    const [allEquip, setAllEquip] = useState([]);
    const [updateTime, setUpdateTime] = useState('');
    const [remark, setRemark] = useState(''); // [新增] 公告备注
    const [selectedMain, setSelectedMain] = useState([]);
    const [selectedSub, setSelectedSub] = useState([]);
    const [selectedEffect, setSelectedEffect] = useState([]);
    const [selectedRarities, setSelectedRarities] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [result, setResult] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showBackTop, setShowBackTop] = useState(false); // [新增] 返回顶部开关

    // --- [新增] 监听页面滚动，控制返回顶部按钮 ---
    usePageScroll((res) => {
        if (res.scrollTop > 500 && !showBackTop) setShowBackTop(true);
        if (res.scrollTop <= 500 && showBackTop) setShowBackTop(false);
    });

    const scrollToTop = () => {
        Taro.pageScrollTo({ scrollTop: 0, duration: 300 });
    };

    // --- 辅助函数 ---
    const parseTags = (tags) => {
        if (!tags || tags.length < 2) return { main: null, sub: null, effect: null };
        if (tags.length === 4) return { main: tags[1], sub: tags[2], effect: tags[3] };
        else if (tags.length === 3) return { main: tags[1], sub: null, effect: tags[2] };
        else if (tags.length === 2) return { main: null, sub: null, effect: tags[1] };
        return { main: null, sub: null, effect: null };
    };

    const getName = (str) => {
        if (!str) return '';
        const match = str.match(/^([\u4e00-\u9fa5]+)/);
        return match ? match[1] : str.split('+')[0];
    };

    const getValue = (str) => {
        if (!str) return 0;
        const match = str.match(/(\d+(\.\d+)?)/);
        return match ? parseFloat(match[0]) : 0;
    };

    // --- 0. [修改] 优先拉取网络，5秒超时，失败走缓存 ---
    useEffect(() => {
        const loadData = async () => {
            Taro.showLoading({ title: '加载最新数据...' });
            try {
                const noCacheUrl = `${DATA_URL}?t=${new Date().getTime()}`;

                const res = await Taro.request({
                    url: noCacheUrl,
                    method: 'GET',
                    dataType: 'json',
                    timeout: 5000 // 5秒超时限制
                });

                if (res.statusCode === 200 && res.data) {
                    let items = [];
                    let time = '';
                    let note = '';

                    // 兼容旧结构(数组)和新结构(对象)
                    if (Array.isArray(res.data)) {
                        items = res.data;
                    } else if (res.data.items) {
                        items = res.data.items;
                        time = res.data.updateTime || '';
                        note = res.data.remark || '';
                    }

                    // 1. 拉取成功，立刻覆盖更新本地缓存
                    Taro.setStorageSync(CACHE_KEY, { items, time, remark: note });

                    // 2. 渲染页面
                    console.log('装备数据下载成功，条数:', items.length);
                    setAllEquip(items);
                    setUpdateTime(time);
                    setRemark(note);
                    Taro.hideLoading();
                } else {
                    throw new Error('服务器状态异常');
                }
            } catch (err) {
                console.log('拉取数据失败，准备检查缓存:', err);
                Taro.hideLoading();

                // 3. 网络拉取失败，读取本地缓存
                const cachedData = Taro.getStorageSync(CACHE_KEY);
                if (cachedData && cachedData.items && cachedData.items.length > 0) {
                    setAllEquip(cachedData.items);
                    setUpdateTime(cachedData.time || '');
                    setRemark(cachedData.remark || '');

                    Taro.showToast({
                        title: '拉取失败，已使用本地缓存',
                        icon: 'none',
                        duration: 2500
                    });
                } else {
                    // 4. 连不上网，且本地没有缓存
                    Taro.showToast({ title: '请检查网络连接', icon: 'error' });
                }
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    // --- 1. 预处理筛选按钮组 ---
    const filterGroups = useMemo(() => {
        if (allEquip.length === 0) return { main: [], sub: [], effect: [] };
        const mainSet = new Set();
        const subSet = new Set();
        const effectSet = new Set();

        allEquip.forEach(item => {
            const { main, sub, effect } = parseTags(item.tags);
            if (main) mainSet.add(getName(main));
            if (sub) subSet.add(getName(sub));
            if (effect) effectSet.add(getName(effect));
        });

        return {
            main: Array.from(mainSet),
            sub: Array.from(subSet),
            effect: Array.from(effectSet)
        };
    }, [allEquip]);

    // --- 2. 核心筛选与排序 ---
    useEffect(() => {
        if (allEquip.length === 0) return;

        let filtered = allEquip.filter(item => {
            if (selectedRarities.length > 0 && !selectedRarities.includes(item.rarity)) return false;
            if (searchTerm && !item.name.includes(searchTerm)) return false;

            const { main, sub, effect } = parseTags(item.tags);
            const mainName = getName(main);
            const subName = getName(sub);
            const effectName = getName(effect);

            if (selectedMain.length > 0 && (!main || !selectedMain.includes(mainName))) return false;
            if (selectedSub.length > 0 && (!sub || !selectedSub.includes(subName))) return false;
            if (selectedEffect.length > 0 && (!effect || !selectedEffect.includes(effectName))) return false;

            return true;
        });

        filtered.sort((a, b) => {
            const tagsA = parseTags(a.tags);
            const tagsB = parseTags(b.tags);
            let valA = 0, valB = 0;

            if (selectedEffect.length > 0 && selectedMain.length === 0 && selectedSub.length === 0) {
                valA = getValue(tagsA.effect); valB = getValue(tagsB.effect);
            }
            else if (selectedSub.length > 0 && selectedMain.length === 0) {
                valA = getValue(tagsA.sub); valB = getValue(tagsB.sub);
            }
            else {
                valA = getValue(tagsA.main); valB = getValue(tagsB.main);
                if (valA === valB) { valA = getValue(tagsA.effect); valB = getValue(tagsB.effect); }
            }
            return valB - valA;
        });

        setResult(filtered);
    }, [selectedMain, selectedSub, selectedEffect, selectedRarities, searchTerm, allEquip]);

    // --- 交互 ---
    const toggleSelect = (list, setList, item) => {
        if (list.includes(item)) setList(list.filter(i => i !== item));
        else setList([...list, item]);
    };
    const toggleRarity = (r) => {
        if (selectedRarities.includes(r)) setSelectedRarities(selectedRarities.filter(i => i !== r));
        else setSelectedRarities([...selectedRarities, r]);
    };
    const clearAll = () => {
        setSelectedMain([]); setSelectedSub([]); setSelectedEffect([]);
        setSelectedRarities([]); setSearchTerm('');
    };

    return (
        <View className='container'>
            <View className='sticky-header'>
                <View className='header-row'>
                    <View>
                        <Text className='header-title'>装备筛选</Text>
                        {updateTime && <Text className='update-time'>数据更新: {updateTime}</Text>}
                    </View>
                    <View className='reset-btn' onClick={clearAll}>重置</View>
                </View>
                {remark && (
                    <View className='remark-row'>
                        <Text className='update-remark'>{remark}</Text>
                    </View>
                )}
                <View className='search-box'>
                    <Input className='search-input' value={searchTerm} placeholder='搜索装备名称...' onInput={e => setSearchTerm(e.detail.value)} />
                    {searchTerm && <View className='search-clear' onClick={() => setSearchTerm('')}>×</View>}
                </View>
            </View>

            <View className='content-body'>
                {loading ? (
                    <View className='empty-tip'>正在初始化数据...</View>
                ) : (
                    <>
                        {allEquip.length > 0 && (
                            <>
                                <View className='section-title'>星级</View>
                                <View className='rarity-group'>
                                    {[2, 3, 4, 5].map(r => (
                                        <View key={r} className={`rarity-btn r-${r} ${selectedRarities.includes(r) ? 'active' : ''}`} onClick={() => toggleRarity(r)}>
                                            {r} ★
                                        </View>
                                    ))}
                                </View>

                                <View className='section-title'>主词条 (Main)</View>
                                <View className='tags-row'>
                                    {filterGroups.main.map(t => (
                                        <View key={t} className={`tag-btn ${selectedMain.includes(t) ? 'active' : ''}`} onClick={() => toggleSelect(selectedMain, setSelectedMain, t)}>{t}</View>
                                    ))}
                                </View>

                                <View className='section-title'>副词条 (Sub)</View>
                                <View className='tags-row'>
                                    {filterGroups.sub.map(t => (
                                        <View key={t} className={`tag-btn ${selectedSub.includes(t) ? 'active' : ''}`} onClick={() => toggleSelect(selectedSub, setSelectedSub, t)}>{t}</View>
                                    ))}
                                </View>

                                <View className='section-title'>效果 (Effect)</View>
                                <View className='tags-row'>
                                    {filterGroups.effect.map(t => (
                                        <View key={t} className={`tag-btn ${selectedEffect.includes(t) ? 'active' : ''}`} onClick={() => toggleSelect(selectedEffect, setSelectedEffect, t)}>{t}</View>
                                    ))}
                                </View>
                            </>
                        )}

                        <View className='result-header'>匹配结果 ({result.length})</View>
                        <View className='result-list'>
                            {result.map((item, idx) => {
                                const { main, sub, effect } = parseTags(item.tags);
                                return (
                                    <View key={idx} className={`equip-card rank-${item.rarity}`}>
                                        <View className='card-left'>
                                            {item.image ? (
                                                <Image className='equip-img' src={item.image} mode='aspectFit' lazyLoad />
                                            ) : (
                                                <View className='img-placeholder'>无图</View>
                                            )}
                                        </View>
                                        <View className='card-right'>
                                            <View className='card-top'>
                                                <Text className='equip-name'>{item.name}</Text>
                                                <Text className='equip-rarity'>{'★'.repeat(item.rarity)}</Text>
                                            </View>
                                            <View className='stats-grid'>
                                                <View className='stat-row base'>
                                                    <Text className='label'>基础</Text>
                                                    <Text className='val'>{item.tags[0]}</Text>
                                                </View>
                                                {main && <View className='stat-row main'><Text className='label'>主</Text><Text className='val'>{main}</Text></View>}
                                                {sub && <View className='stat-row sub'><Text className='label'>副</Text><Text className='val'>{sub}</Text></View>}
                                                {effect && <View className='stat-row effect'><Text className='label'>效</Text><Text className='val'>{effect}</Text></View>}
                                            </View>
                                        </View>
                                    </View>
                                );
                            })}
                            {result.length === 0 && !loading && <View className='empty-tip'>未找到相关装备</View>}
                        </View>
                    </>
                )}

                <View className='footer-info'>
                    <Text className='footer-text'>数据源于网络，仅供学习交流</Text>
                </View>
            </View>

            {/* [新增] 返回顶部悬浮按钮 */}
            {showBackTop && (
                <View className='back-to-top' onClick={scrollToTop}>
                    <View className='arrow-up'></View>
                </View>
            )}
        </View>
    );
}