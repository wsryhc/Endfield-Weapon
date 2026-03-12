import React, { useState, useEffect, useMemo } from 'react';
import Taro, { usePageScroll } from '@tarojs/taro';
import { View, Text, Input, Image } from '@tarojs/components'; 
import './index.scss';

// [配置] 武器数据源与缓存键名
const DATA_URL = "https://wsryhc.top/endfield/weapons_data.json";
const CACHE_KEY = 'weapons_data_cache_v1';

export default function Index() {
  const [allWeapons, setAllWeapons] = useState([]); 
  const [updateTime, setUpdateTime] = useState(''); 
  const [remark, setRemark] = useState(''); // 公告备注
  const [selectedTags, setSelectedTags] = useState([]); 
  const [selectedRarities, setSelectedRarities] = useState([]); 
  const [searchTerm, setSearchTerm] = useState(''); 
  const [result, setResult] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [showBackTop, setShowBackTop] = useState(false); // 返回顶部开关

  // --- 监听页面滚动，控制返回顶部按钮 ---
  usePageScroll((res) => {
    if (res.scrollTop > 500 && !showBackTop) setShowBackTop(true);
    if (res.scrollTop <= 500 && showBackTop) setShowBackTop(false);
  });

  const scrollToTop = () => {
    Taro.pageScrollTo({ scrollTop: 0, duration: 300 });
  };

  // --- 0. 优先拉取网络，失败则走缓存 ---
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
          let items = Array.isArray(res.data) ? res.data : (res.data.items || []);
          let time = res.data.updateTime || '';
          let note = res.data.remark || '';

          // 1. 拉取成功，立刻覆盖更新本地缓存
          Taro.setStorageSync(CACHE_KEY, { items, time, remark: note });

          // 2. 渲染页面
          setAllWeapons(items);
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
        if (cachedData && cachedData.items) {
          setAllWeapons(cachedData.items);
          setUpdateTime(cachedData.time);
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

  // --- 1. 预处理词条分组 ---
  const tagGroups = useMemo(() => {
    if (allWeapons.length === 0) return [];
    const group0 = new Set(); const group1 = new Set(); const group2 = new Set(); 
    allWeapons.forEach(w => {
      const t = w.tags;
      if (!t || t.length === 0) return;
      if (t[0]) group0.add(t[0]);
      if (t.length === 3) { if (t[1]) group1.add(t[1]); if (t[2]) group2.add(t[2]); } 
      else if (t.length === 2) { if (t[1]) group2.add(t[1]); }
    });
    const sortFn = (a, b) => a.length - b.length;
    return [
      { title: '基础属性 (位0)', data: Array.from(group0).sort(sortFn) },
      { title: '进阶属性 (位1)', data: Array.from(group1).sort(sortFn) },
      { title: '核心特性 (位2)', data: Array.from(group2).sort(sortFn) },
    ];
  }, [allWeapons]);

  // --- 2. 核心筛选逻辑 ---
  useEffect(() => {
    if (allWeapons.length === 0) return;
    let filtered = allWeapons.filter(weapon => {
      const isRarityMatch = selectedRarities.length === 0 || selectedRarities.includes(weapon.rarity);
      const isTagMatch = selectedTags.length === 0 || selectedTags.some(tag => weapon.tags.includes(tag));
      const isNameMatch = searchTerm === '' || weapon.name.includes(searchTerm);
      return isRarityMatch && isTagMatch && isNameMatch;
    });
    if (selectedTags.length > 0) {
      filtered.sort((a, b) => {
        const matchCountA = a.tags.filter(t => selectedTags.includes(t)).length;
        const matchCountB = b.tags.filter(t => selectedTags.includes(t)).length;
        if (matchCountA !== matchCountB) return matchCountB - matchCountA; 
        return b.rarity - a.rarity; 
      });
    } else {
      filtered.sort((a, b) => b.rarity - a.rarity);
    }
    setResult(filtered);
  }, [selectedTags, selectedRarities, searchTerm, allWeapons]);

  // --- 交互 ---
  const toggleTag = (tag) => {
    if (selectedTags.includes(tag)) setSelectedTags(selectedTags.filter(t => t !== tag));
    else setSelectedTags([...selectedTags, tag]);
  };
  const toggleRarity = (r) => {
    if (selectedRarities.includes(r)) setSelectedRarities(selectedRarities.filter(item => item !== r));
    else setSelectedRarities([...selectedRarities, r]);
  };
  const clearAll = () => {
    setSelectedTags([]); setSelectedRarities([]); setSearchTerm(''); 
  };

  return (
    <View className='container'>
      <View className='sticky-header'>
        <View className='header-row'>
          <View>
            <Text className='header-title'>武器筛选</Text>
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
          <Input className='search-input' value={searchTerm} placeholder='输入武器名称搜索...' onInput={(e) => setSearchTerm(e.detail.value)} />
          {searchTerm !== '' && <View className='search-clear' onClick={() => setSearchTerm('')}>×</View>}
        </View>
      </View>

      <View className='content-body'>
        {loading ? (
          <View className='empty-tip'>正在初始化数据...</View>
        ) : (
          <>
            {allWeapons.length > 0 && (
              <>
                <View className='section-title'>星级筛选</View>
                <View className='rarity-group'>
                  {[3, 4, 5, 6].map(r => (
                    <View key={r} className={`rarity-btn r-${r} ${selectedRarities.includes(r) ? 'active' : ''}`} onClick={() => toggleRarity(r)}>
                      {r} ★
                    </View>
                  ))}
                </View>

                {tagGroups.map((group, index) => (
                  <View key={index} className='tag-section'>
                    <View className='section-subtitle'>{group.title}</View>
                    <View className='tags-row'>
                      {group.data.map(tag => (
                        <View key={tag} className={`tag-btn ${selectedTags.includes(tag) ? 'active' : ''}`} onClick={() => toggleTag(tag)}>
                          {tag}
                        </View>
                      ))}
                    </View>
                  </View>
                ))}
              </>
            )}

            <View className='result-header'>匹配结果 ({result.length})</View>
            
            <View className='result-list'>
              {result.map((weapon, index) => (
                <View key={index} className={`weapon-card rank-${weapon.rarity}`}>
                  <View className='card-left'>
                    {weapon.image ? (
                      <Image className='weapon-img' src={weapon.image} mode='aspectFit' lazyLoad />
                    ) : (
                      <View className='img-placeholder'>无图</View>
                    )}
                  </View>
                  <View className='card-right'>
                    <View className='card-top'>
                      <Text className='weapon-name'>{weapon.name}</Text>
                      <Text className='weapon-rarity'>{'★'.repeat(weapon.rarity)}</Text>
                    </View>
                    <View className='card-tags'>
                      {weapon.tags.map(t => (
                        <Text key={t} className={`mini-tag ${selectedTags.includes(t) ? 'highlight' : ''}`}>
                          {t}
                        </Text>
                      ))}
                    </View>
                  </View>
                </View>
              ))}
              {result.length === 0 && !loading && <View className='empty-tip'>未找到相关武器</View>}
            </View>
          </>
        )}

        <View className='footer-info'>
          <Text className='footer-text'>数据源于网络，仅供学习交流</Text>
        </View>
      </View>

      {/* 返回顶部按钮 */}
      {showBackTop && (
        <View className='back-to-top' onClick={scrollToTop}>
          <View className='arrow-up'></View>
        </View>
      )}
    </View>
  );
}