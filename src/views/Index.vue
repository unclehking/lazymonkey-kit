<template>
    <div class="welcome-container">
        <div class="welcome-text">
            <p>欢迎使用懒猴工具站！</p>
            <p>本工具站完全使用AI生成，未使用人工编写一行代码。</p>
        </div>
    </div>
</template>

<script>
export default {
    name: 'Index'
}
</script>

<style scoped>
.welcome-container {
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
}

.welcome-text {
    font-size: 1.5rem;
    color: #2c3e50;
    line-height: 2;
}

.welcome-text p {
    margin: 0;
}

@media (max-width: 768px) {
    .welcome-text {
        font-size: 1.2rem;
        padding: 0 20px;
    }
}
</style> 