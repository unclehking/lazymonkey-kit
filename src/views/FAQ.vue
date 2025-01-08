<template>
  <div class="faq">
    <h2>常见问题</h2>
    
    <div class="faq-list">
      <div v-for="(item, index) in faqItems" 
           :key="index" 
           class="faq-item"
           :class="{ 'active': activeIndex === index }">
        <div class="faq-question" @click="toggleItem(index)">
          <span>{{ item.question }}</span>
          <i class="arrow" :class="{ 'up': activeIndex === index }">▼</i>
        </div>
        <div class="faq-answer" v-show="activeIndex === index">
          {{ item.answer }}
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'FAQ',
  data() {
    return {
      activeIndex: null,
      faqItems: [
        {
          question: '如何使用图片格式转换功能？',
          answer: '点击"图片格式转换"菜单，然后将图片拖拽到指定区域或点击选择文件，选择需要转换的目标格式，点击"开始转换"即可。'
        },
        {
          question: '支持哪些图片格式转换？',
          answer: '目前支持JPEG、PNG、WEBP、GIF等常见图片格式之间的互相转换。'
        },
        {
          question: '文字处理功能有哪些？',
          answer: '文字处理功能包括文本格式化、大小写转换、简繁体转换等多种实用工具。'
        },
        {
          question: '如何导出处理后的文件？',
          answer: '处理完成后，系统会自动提供下载链接，点击即可下载处理后的文件。'
        },
        {
          question: '是否支持批量处理？',
          answer: '是的，我们支持批量上传和处理文件，具体数量限制请参考各功能模块的说明。'
        }
      ]
    }
  },
  methods: {
    toggleItem(index) {
      this.activeIndex = this.activeIndex === index ? null : index
    }
  }
}
</script>

<style scoped>
.faq {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.faq-list {
  margin-top: 20px;
}

.faq-item {
  margin-bottom: 10px;
  border: 1px solid #eee;
  border-radius: 4px;
  overflow: hidden;
}

.faq-question {
  padding: 15px 20px;
  background-color: #fff;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 500;
}

.faq-item.active .faq-question {
  background-color: #f8f9fa;
}

.arrow {
  font-size: 12px;
  transition: transform 0.3s ease;
}

.arrow.up {
  transform: rotate(180deg);
}

.faq-answer {
  padding: 15px 20px;
  background-color: #fff;
  border-top: 1px solid #eee;
  line-height: 1.6;
  color: #666;
}

.faq-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

@media (max-width: 768px) {
  .faq {
    padding: 10px;
  }
  
  .faq-question {
    padding: 12px 15px;
  }
  
  .faq-answer {
    padding: 12px 15px;
  }
}
</style> 