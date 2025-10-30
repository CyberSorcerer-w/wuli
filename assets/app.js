// 初始化图表
function initializePlots() {
    const patternLayout = {
        title: "双缝干涉条纹图样",
        xaxis: { title: "屏幕位置 (mm)" },
        yaxis: { title: "" },
        height: 300,
        margin: { l: 50, r: 50, t: 50, b: 50 }
    };

    const profileLayout = {
        title: "光强分布曲线",
        xaxis: { title: "屏幕位置 (mm)" },
        yaxis: { title: "相对光强", range: [0, 1] },
        height: 300,
        margin: { l: 50, r: 50, t: 50, b: 50 }
    };

    Plotly.newPlot('interference-pattern', [{
        type: 'heatmap',
        z: [[]],
        colorscale: 'Gray',
        showscale: false
    }], patternLayout);

    Plotly.newPlot('intensity-profile', [{
        type: 'scatter',
        mode: 'lines',
        x: [],
        y: [],
        line: { color: 'blue', width: 2 },
        name: '光强分布'
    }], profileLayout);

    updateInterference();
}

// 更新显示值
function updateSliderValues() {
    document.getElementById('slit-separation-value').textContent = 
        document.getElementById('slit-separation-slider').value + ' mm';
    
    document.getElementById('screen-distance-value').textContent = 
        document.getElementById('screen-distance-slider').value + ' m';
    
    document.getElementById('wavelength-value').textContent = 
        document.getElementById('wavelength-slider').value + ' nm';
    
    const coherenceValue = parseFloat(document.getElementById('coherence-slider').value);
    document.getElementById('coherence-value').textContent = 
        coherenceValue > 0.8 ? '好' : coherenceValue > 0.5 ? '中' : '差';
    
    const vibrationValue = parseFloat(document.getElementById('vibration-slider').value);
    document.getElementById('vibration-value').textContent = 
        vibrationValue < 0.3 ? '轻微' : vibrationValue < 0.7 ? '中等' : '严重';
    
    document.getElementById('slit-width-value').textContent = 
        document.getElementById('slit-width-slider').value + ' μm';
}

// 计算干涉图样
function updateInterference() {
    // 获取滑块值
    const d = parseFloat(document.getElementById('slit-separation-slider').value);
    const L = parseFloat(document.getElementById('screen-distance-slider').value);
    const wavelength = parseFloat(document.getElementById('wavelength-slider').value);
    const coherence = parseFloat(document.getElementById('coherence-slider').value);
    const vibration = parseFloat(document.getElementById('vibration-slider').value);
    const slit_width = parseFloat(document.getElementById('slit-width-slider').value);

    // 单位转换
    const d_m = d * 1e-3;  // 毫米转米
    const L_m = L;         // 米
    const lambda_m = wavelength * 1e-9;  // 纳米转米
    const a_m = slit_width * 1e-6;       // 微米转米

    // 计算条纹间距
    const fringe_spacing = (lambda_m * L_m) / d_m;  // 米
    const fringe_spacing_mm = fringe_spacing * 1000;  // 毫米

    // 创建屏幕坐标
    const x = [];
    for (let i = 0; i < 1000; i++) {
        x.push(-50 + i * 100 / 1000);
    }
    const x_m = x.map(val => val * 1e-3);  // 转换为米

    // 计算光强分布
    const intensity = x_m.map(x_val => {
        // 正确的物理公式
        const beta = (Math.PI * a_m * x_val) / (lambda_m * L_m);
        const alpha = (Math.PI * d_m * x_val) / (lambda_m * L_m);

        // 避免除以零
        const beta_safe = Math.abs(beta) < 1e-10 ? 1e-10 : beta;

        // 单缝衍射包络
        const single_slit = Math.pow(Math.sin(beta_safe) / beta_safe, 2);

        // 双缝干涉
        const double_slit = Math.pow(Math.cos(alpha), 2);

        // 总强度
        let intensity_val = single_slit * double_slit;

        // 考虑光源单色性和环境振动的影响
        const coherence_factor = coherence;
        const vibration_factor = 1 - vibration * 0.3;

        // 改进的噪声模型
        intensity_val = intensity_val * coherence_factor * vibration_factor;
        
        // 更合理的噪声
        const noise_level = (1 - coherence) * 0.2 + vibration * 0.3;
        if (noise_level > 0) {
            intensity_val = intensity_val * (1 + (Math.random() - 0.5) * noise_level);
        }
        
        return Math.max(0, Math.min(1, intensity_val));
    });

    // 创建二维干涉图样数据
    const y = [];
    for (let i = 0; i < 200; i++) {
        y.push(-20 + i * 40 / 200);
    }
    
    const intensity_2d = [];
    for (let i = 0; i < y.length; i++) {
        // 添加垂直方向的轻微变化以模拟实际干涉图样
        const row = intensity.map((val, j) => {
            const vertical_variation = 1 + 0.1 * Math.sin(y[i] * 0.5) * Math.random();
            return Math.min(1, val * vertical_variation);
        });
        intensity_2d.push(row);
    }

    // 更新干涉图样
    Plotly.react('interference-pattern', [{
        type: 'heatmap',
        x: x,
        y: y,
        z: intensity_2d,
        colorscale: 'Gray',
        showscale: false,
        hoverinfo: 'none'
    }], {
        title: "双缝干涉条纹图样",
        xaxis: { title: "屏幕位置 (mm)" },
        yaxis: { title: "" },
        height: 300,
        margin: { l: 50, r: 50, t: 50, b: 50 }
    });

    // 更新光强分布曲线
    Plotly.react('intensity-profile', [{
        type: 'scatter',
        mode: 'lines',
        x: x,
        y: intensity,
        line: { color: 'blue', width: 2 },
        name: '光强分布'
    }], {
        title: "光强分布曲线",
        xaxis: { title: "屏幕位置 (mm)" },
        yaxis: { title: "相对光强", range: [0, 1] },
        height: 300,
        margin: { l: 50, r: 50, t: 50, b: 50 }
    });

    // 更新条纹间距显示
    document.getElementById('fringe-spacing-display').textContent = 
        `条纹间距: ${fringe_spacing_mm.toFixed(3)} mm`;

    // 更新理论解释
    const coherenceText = coherence > 0.8 ? '良好' : coherence > 0.5 ? '一般' : '较差';
    const vibrationText = vibration < 0.3 ? '轻微' : vibration < 0.7 ? '中等' : '严重';
    
    document.getElementById('theory-explanation').innerHTML = 
        `条纹间距理论值: ${fringe_spacing_mm.toFixed(3)} mm<br>` +
        `影响因素分析:<br>` +
        `- 光源相干性: ${coherenceText} (${coherence.toFixed(1)})<br>` +
        `- 环境振动: ${vibrationText} (${vibration.toFixed(1)})<br>` +
        `- 实际应用: 半导体光刻技术利用类似原理实现纳米级图案化`;
}

// 事件监听
document.addEventListener('DOMContentLoaded', function() {
    // 初始化
    initializePlots();
    updateSliderValues();

    // 为所有滑块添加事件监听
    const sliders = document.querySelectorAll('input[type="range"]');
    sliders.forEach(slider => {
        slider.addEventListener('input', function() {
            updateSliderValues();
            updateInterference();
        });
    });

    // 初始更新
    updateInterference();
});
