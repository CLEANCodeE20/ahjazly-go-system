// ========================================
// الإعدادات والمتغيرات
// ========================================
const API_URL = 'http://localhost:8000';
const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const typingIndicator = document.getElementById('typingIndicator');
const quickQuestions = document.getElementById('quickQuestions');

// ========================================
// دوال مساعدة
// ========================================

/**
 * الحصول على الوقت الحالي بصيغة مقروءة
 */
function getCurrentTime() {
    const now = new Date();
    return now.toLocaleTimeString('ar-SA', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

/**
 * إنشاء عنصر رسالة
 */
function createMessageElement(text, isUser = false) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;
    
    const avatarDiv = document.createElement('div');
    avatarDiv.className = 'message-avatar';
    avatarDiv.innerHTML = isUser ? 
        `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M12 11C14.2091 11 16 9.20914 16 7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7C8 9.20914 9.79086 11 12 11Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>` :
        `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z" fill="currentColor"/>
        </svg>`;
    
    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content';
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';
    
    // تحويل النص إلى HTML مع دعم التنسيق
    bubbleDiv.innerHTML = formatMessage(text);
    
    const timeDiv = document.createElement('div');
    timeDiv.className = 'message-time';
    timeDiv.textContent = getCurrentTime();
    
    contentDiv.appendChild(bubbleDiv);
    contentDiv.appendChild(timeDiv);
    
    messageDiv.appendChild(avatarDiv);
    messageDiv.appendChild(contentDiv);
    
    return messageDiv;
}

/**
 * تنسيق الرسالة (تحويل النص إلى HTML)
 */
function formatMessage(text) {
    // تحويل الأسطر الجديدة إلى فقرات
    let formatted = text.split('\n\n').map(para => {
        if (para.trim()) {
            // التحقق من وجود قوائم
            if (para.includes('- ') || para.includes('• ')) {
                const items = para.split('\n').filter(line => line.trim());
                const listItems = items.map(item => {
                    const cleaned = item.replace(/^[-•]\s*/, '').trim();
                    return cleaned ? `<li>${cleaned}</li>` : '';
                }).join('');
                return `<ul>${listItems}</ul>`;
            }
            return `<p>${para.replace(/\n/g, '<br>')}</p>`;
        }
        return '';
    }).join('');
    
    // تنسيق النص الغامق
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // تنسيق الأرقام والأسعار
    formatted = formatted.replace(/(\d+)\s*(ريال|درهم|دينار)/g, '<strong>$1 $2</strong>');
    
    return formatted;
}

/**
 * إظهار مؤشر الكتابة
 */
function showTypingIndicator() {
    typingIndicator.style.display = 'flex';
    scrollToBottom();
}

/**
 * إخفاء مؤشر الكتابة
 */
function hideTypingIndicator() {
    typingIndicator.style.display = 'none';
}

/**
 * التمرير إلى أسفل المحادثة
 */
function scrollToBottom() {
    setTimeout(() => {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }, 100);
}

/**
 * تعطيل/تفعيل نموذج الإرسال
 */
function setFormDisabled(disabled) {
    messageInput.disabled = disabled;
    sendBtn.disabled = disabled;
    
    if (disabled) {
        sendBtn.style.opacity = '0.5';
        sendBtn.style.cursor = 'not-allowed';
    } else {
        sendBtn.style.opacity = '1';
        sendBtn.style.cursor = 'pointer';
    }
}

/**
 * إضافة رسالة إلى المحادثة
 */
function addMessage(text, isUser = false) {
    const messageElement = createMessageElement(text, isUser);
    chatMessages.appendChild(messageElement);
    scrollToBottom();
}

/**
 * إظهار رسالة خطأ
 */
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'message bot-message';
    errorDiv.innerHTML = `
        <div class="message-avatar">
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 5C13.66 5 15 6.34 15 8C15 9.66 13.66 11 12 11C10.34 11 9 9.66 9 8C9 6.34 10.34 5 12 5ZM12 19.2C9.5 19.2 7.29 17.92 6 15.98C6.03 13.99 10 12.9 12 12.9C13.99 12.9 17.97 13.99 18 15.98C16.71 17.92 14.5 19.2 12 19.2Z" fill="currentColor"/>
            </svg>
        </div>
        <div class="message-content">
            <div class="message-bubble" style="background: linear-gradient(135deg, rgba(239, 68, 68, 0.1), rgba(220, 38, 38, 0.05)); border-color: rgba(239, 68, 68, 0.3);">
                <p>⚠️ ${message}</p>
            </div>
            <div class="message-time">${getCurrentTime()}</div>
        </div>
    `;
    chatMessages.appendChild(errorDiv);
    scrollToBottom();
}

// ========================================
// التعامل مع API
// ========================================

/**
 * إرسال رسالة إلى API
 */
async function sendMessageToAPI(message) {
    try {
        const response = await fetch(`${API_URL}/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                max_results: 5
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        return data.answer;
    } catch (error) {
        console.error('Error calling API:', error);
        throw error;
    }
}

/**
 * معالجة إرسال الرسالة
 */
async function handleSendMessage(message) {
    if (!message.trim()) return;

    // إخفاء الأسئلة السريعة بعد أول رسالة
    if (quickQuestions.style.display !== 'none') {
        quickQuestions.style.display = 'none';
    }

    // إضافة رسالة المستخدم
    addMessage(message, true);
    
    // مسح حقل الإدخال
    messageInput.value = '';
    
    // تعطيل النموذج وإظهار مؤشر الكتابة
    setFormDisabled(true);
    showTypingIndicator();

    try {
        // إرسال الرسالة إلى API
        const response = await sendMessageToAPI(message);
        
        // إخفاء مؤشر الكتابة
        hideTypingIndicator();
        
        // إضافة رد البوت
        addMessage(response, false);
    } catch (error) {
        // إخفاء مؤشر الكتابة
        hideTypingIndicator();
        
        // إظهار رسالة خطأ
        showError('عذراً، حدث خطأ في الاتصال. يرجى المحاولة مرة أخرى.');
    } finally {
        // تفعيل النموذج مرة أخرى
        setFormDisabled(false);
        messageInput.focus();
    }
}

// ========================================
// معالجات الأحداث
// ========================================

/**
 * معالج إرسال النموذج
 */
chatForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const message = messageInput.value.trim();
    await handleSendMessage(message);
});

/**
 * معالج الأسئلة السريعة
 */
document.querySelectorAll('.quick-question-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        const question = btn.getAttribute('data-question');
        await handleSendMessage(question);
    });
});

/**
 * معالج اختصار لوحة المفاتيح (Enter للإرسال)
 */
messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatForm.dispatchEvent(new Event('submit'));
    }
});

/**
 * التركيز التلقائي على حقل الإدخال عند تحميل الصفحة
 */
window.addEventListener('load', () => {
    messageInput.focus();
    
    // فحص حالة الخدمة
    checkServiceHealth();
});

/**
 * فحص صحة الخدمة
 */
async function checkServiceHealth() {
    try {
        const response = await fetch(`${API_URL}/health`);
        const data = await response.json();
        
        if (data.status === 'healthy') {
            console.log('✅ Service is healthy');
            console.log('Database:', data.database);
            console.log('Embedding Model:', data.embedding_model);
            console.log('Chat Model:', data.chat_model);
        } else {
            console.warn('⚠️ Service is unhealthy:', data);
            updateStatusIndicator(false);
        }
    } catch (error) {
        console.error('❌ Failed to check service health:', error);
        updateStatusIndicator(false);
    }
}

/**
 * تحديث مؤشر الحالة
 */
function updateStatusIndicator(isHealthy) {
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.querySelector('.status-text');
    const statusIndicator = document.querySelector('.status-indicator');
    
    if (isHealthy) {
        statusDot.style.background = '#22c55e';
        statusText.textContent = 'متصل';
        statusText.style.color = '#22c55e';
        statusIndicator.style.background = 'rgba(34, 197, 94, 0.1)';
        statusIndicator.style.borderColor = 'rgba(34, 197, 94, 0.3)';
    } else {
        statusDot.style.background = '#ef4444';
        statusText.textContent = 'غير متصل';
        statusText.style.color = '#ef4444';
        statusIndicator.style.background = 'rgba(239, 68, 68, 0.1)';
        statusIndicator.style.borderColor = 'rgba(239, 68, 68, 0.3)';
    }
}

// ========================================
// تأثيرات إضافية
// ========================================

/**
 * تأثير الجسيمات عند الإرسال
 */
function createParticleEffect(x, y) {
    for (let i = 0; i < 5; i++) {
        const particle = document.createElement('div');
        particle.style.position = 'fixed';
        particle.style.left = x + 'px';
        particle.style.top = y + 'px';
        particle.style.width = '4px';
        particle.style.height = '4px';
        particle.style.borderRadius = '50%';
        particle.style.background = 'linear-gradient(135deg, #6366f1, #ec4899)';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '9999';
        
        document.body.appendChild(particle);
        
        const angle = (Math.PI * 2 * i) / 5;
        const velocity = 2;
        const vx = Math.cos(angle) * velocity;
        const vy = Math.sin(angle) * velocity;
        
        let posX = x;
        let posY = y;
        let opacity = 1;
        
        const animate = () => {
            posX += vx;
            posY += vy;
            opacity -= 0.02;
            
            particle.style.left = posX + 'px';
            particle.style.top = posY + 'px';
            particle.style.opacity = opacity;
            
            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                particle.remove();
            }
        };
        
        animate();
    }
}

/**
 * إضافة تأثير الجسيمات عند النقر على زر الإرسال
 */
sendBtn.addEventListener('click', (e) => {
    const rect = sendBtn.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    createParticleEffect(x, y);
});

// ========================================
// معالجة الأخطاء العامة
// ========================================

window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
});

window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
});

console.log('🤖 Chatbot interface loaded successfully!');
