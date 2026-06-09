

let modal = Vue.component('modal', {
  template: `
    <div>
        <!-- 로그인 모달 -->
        <div class="modal-mask login-modal-fixed" id='111' v-show="show" @click="close">
            <div class="modal-wrapper">
                <div class="modal-container" @click.stop>
                    <div class="modal-content">
                     <div v-html="dealHtml"></div>
                     <!-- 添加用户名和密码的输入字段 -->
                     <input v-model="username" placeholder="用户名">
                     <input v-model="password" placeholder="密码" type="password">
                    </div>
                    <!-- 添加登录按钮 -->
                    <button class="modal-default-button" @click="login">登录</button>
                    <button class="modal-default-button" @click="close">关闭</button>
                </div>
            </div>
        </div>
        
        <!-- 설정 모달 -->
        <div class="modal-mask settings-modal-fixed" v-show="showSettings" @click="closeSettings">
            <div class="modal-wrapper">
                <div class="modal-container" @click.stop style="width: 400px; max-width: 90vw;">
                    <div class="modal-header" style="padding: 20px; border-bottom: 1px solid #eee;">
                        <h3 style="margin: 0; color: #333;">표시 설정</h3>
                    </div>
                    <div class="modal-content" style="padding: 20px;">
                        <!-- 이미지 크기 설정 -->
                        <div style="margin-bottom: 25px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #555;">
                                사진 크기: <span style="color: #007bff;">{{imageSize}}rem</span>
                            </label>
                            <input type="range" 
                                   v-model="imageSize" 
                                   step="0.1" 
                                   min="11" 
                                   max="27" 
                                   @input="updateImageSize"
                                   style="width: 100%; cursor: pointer;">
                            <div style="display: flex; justify-content: space-between; font-size: 12px; color: #666; margin-top: 4px;">
                                <span>11rem</span>
                                <span>27rem</span>
                            </div>
                        </div>
                        
                        <!-- 글씨 크기 설정 -->
                        <div style="margin-bottom: 25px;">
                            <label style="display: block; margin-bottom: 8px; font-weight: bold; color: #555;">
                                글씨 크기: <span style="color: #007bff;">{{fontSize}}px</span>
                            </label>
                            <input type="range" 
                                   v-model="fontSize" 
                                   step="0.1" 
                                   min="12" 
                                   max="22" 
                                   @input="updateFontSize"
                                   style="width: 100%; cursor: pointer;">
                            <div style="display: flex; justify-content: space-between; font-size: 12px; color: #666; margin-top: 4px;">
                                <span>12px</span>
                                <span>22px</span>
                            </div>
                        </div>
                        
                        <!-- 미리보기 -->
                        <div style="border: 1px solid #ddd; border-radius: 4px; padding: 15px; background: #f8f9fa; margin-bottom: 20px;">
                            <div style="font-size: 12px; color: #666; margin-bottom: 10px;">미리보기:</div>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <div :style="'width: ' + (imageSize * 0.6) + 'rem; height: ' + (imageSize * 0.6) + 'rem; background: #ddd; border-radius: 4px; display: flex; align-items: center; justify-content: center; color: #666; font-size: 12px;'">
                                    이미지
                                </div>
                                <div :style="'font-size: ' + fontSize + 'px; color: #4b4b4b;'">
                                    상품명 예시
                                </div>
                            </div>
                        </div>
                        
                        <!-- 초기화 버튼 -->
                        <div style="text-align: center; margin-bottom: 15px;">
                            <button @click="resetToDefault" 
                                    style="background: #6c757d; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 14px;">
                                기본값으로 초기화
                            </button>
                        </div>
                    </div>
                    <div class="modal-footer" style="padding: 15px 20px; border-top: 1px solid #eee; text-align: right;">
                        <button class="modal-default-button" @click="closeSettings" 
                                style="background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer;">
                            확인
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </div> 
    `,
  data() {
    return {
      username: '',
      password: '',
      showSettings: false,
      imageSize: 13.75, // 기본값 (220px / 16px = 13.75rem)
      fontSize: 16 // 기본값
    };
  },
  props: ['show', 'dealHtml'],
  methods: {
    close: function() {
      this.$emit('close');
    },
    // 添加登录方法
    login: async function (){
      try {
        const response = await axios.post(
          "https://k.11st.co.kr/seann/login",
          {
            username: this.username,
            password: this.password,
          },
          { withCredentials: true }
        );
        if (response.status === 200) {
          console.log("登录成功");
          this.close(); // 登录成功后关闭模态框
        }
      } catch (error) {
        console.error("登录失败", error);
      }
    }
  },
});
export default modal;