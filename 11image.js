$(document).on("click", "#image1", function () {
    console.log(123123111)
    if(location.href.includes('amazontab')){
        getimageurl_amazon();
    } else {
        getimageurl_om();
    }

    return false;
});



function gotoimage_amazon() {
    let thumbnailContainer = document.getElementById('thumbnailContainer');

    // 如果 thumbnailContainer 已经存在且可见，直接退出函数
    if (thumbnailContainer && thumbnailContainer.style.display === 'block') {
        thumbnailContainer.style.display = 'none';
        thumbnailContainer.innerHTML = ''; // 清空内容
        return;
    }

    // 每次点击都重新生成 thumbnailContainer
    if (thumbnailContainer) {
        thumbnailContainer.remove();
    }

    thumbnailContainer = document.createElement('div');
    thumbnailContainer.id = 'thumbnailContainer';
    thumbnailContainer.style.display = 'none';
    thumbnailContainer.style.position = 'fixed';
    thumbnailContainer.style.top = '0';
    thumbnailContainer.style.left = '0';
    thumbnailContainer.style.width = '100%';
    thumbnailContainer.style.height = '100%';
    thumbnailContainer.style.background = 'rgba(0, 0, 0, 0.8)';
    thumbnailContainer.style.zIndex = '1000';
    thumbnailContainer.style.overflow = 'auto';
    document.body.appendChild(thumbnailContainer);

    // 添加点击事件，用于关闭缩略图视图
    thumbnailContainer.addEventListener('click', function (event) {
        if (event.target === thumbnailContainer) {
            thumbnailContainer.style.display = 'none';
            thumbnailContainer.innerHTML = ''; // 清空缩略图内容
        }
    });

    let images = location.href.includes('amazontab') ? $('a img').filter(function () {
        return $(this).is(':visible') && !$(this).closest('#footer').length;
    }).toArray() : $('.c-card-item__thumb img').filter(function () {
        return $(this).is(':visible') && !$(this).closest('#footer').length;
    }).toArray();

    console.log(images.length)


    images.forEach((img, index) => {
        let closestLink = $(img).closest('a');
        if (!closestLink.length) return;

        let actionIdArea = closestLink.attr('data-log-actionid-area');



        let thumbnailLink = document.createElement('a');
        thumbnailLink.style.display = 'inline-block';
        thumbnailLink.style.cursor = 'pointer'; // 改变鼠标样式以指示可点击

        let thumbnail = document.createElement('img');
        thumbnail.src = img.src;
        thumbnail.style.width = '140px'; // 设置缩略图宽度
        thumbnail.style.height = '140px'; // 设置缩略图高度
        thumbnail.style.margin = '3px'; // 设置间距

        if (actionIdArea === 'amz_hotdeal') {
            thumbnail.style.filter = 'grayscale(100%)'; // 转为灰色
            thumbnail.style.opacity = '0.7'; // 设置半透明
        }

        // 添加点击事件，滚动到对应的图片位置
        thumbnailLink.addEventListener('click', function (event) {
            img.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'start' });
            setTimeout(function () {
                thumbnailContainer.style.display = 'none';
            }, 200); // 等待500毫秒后关闭
        });

        
        thumbnailLink.appendChild(thumbnail);
        thumbnailContainer.appendChild(thumbnailLink);
    });

    thumbnailContainer.style.display = 'block';
}

function getimageurl_amazon() {
    // 每次点击都重新生成 thumbnailContainer
    let existingThumbnailContainer = document.getElementById('thumbnailContainer');
    if (existingThumbnailContainer) {
        existingThumbnailContainer.remove();
    }

    let thumbnailContainer = document.createElement('div');
    thumbnailContainer.id = 'thumbnailContainer';
    thumbnailContainer.style.display = 'none';
    thumbnailContainer.style.position = 'fixed';
    thumbnailContainer.style.top = '0';
    thumbnailContainer.style.left = '0';
    thumbnailContainer.style.width = '100%';
    thumbnailContainer.style.height = '100%';
    thumbnailContainer.style.background = 'rgba(0, 0, 0, 0.8)';
    thumbnailContainer.style.zIndex = '1000';
    thumbnailContainer.style.overflow = 'auto';
    document.body.appendChild(thumbnailContainer);

    // 添加点击事件，用于关闭缩略图视图
    thumbnailContainer.addEventListener('click', function (event) {
        if (event.target === thumbnailContainer) {
            thumbnailContainer.style.display = 'none';
            thumbnailContainer.innerHTML = ''; // 清空缩略图内容
        }
    });


    let images = $('a img').filter(function () {
        return $(this).is(':visible') && !$(this).closest('#footer').length;
    }).toArray() 

        images.forEach((img, index) => {
            // 获取最近的 a 标签
            let closestLink = img.closest('a');
            if (!closestLink) return;
            // 获取 a 标签的 data-log-actionid-area 属性
            let actionIdArea = closestLink.getAttribute('data-log-actionid-area');

            // 创建缩略图超链接
            let thumbnailLink = document.createElement('a');
            thumbnailLink.style.display = 'inline-block';
            thumbnailLink.style.cursor = 'pointer';

            // 创建缩略图图片
            let thumbnail = document.createElement('img');
            thumbnail.src = img.src;
            thumbnail.style.width = '140px'; // 设置缩略图宽度
            thumbnail.style.height = '140px'; // 设置缩略图高度
            thumbnail.style.margin = '3px'; // 设置间距

            // 根据 data-log-actionid-area 的值设置图片边框
            if (actionIdArea === 'amz_hotdeal') {
                thumbnail.style.filter = 'grayscale(100%)'; // 转为灰色
                thumbnail.style.opacity = '0.7'; // 设置半透明
            }

            // 添加点击事件，打开链接但不跳转页面
            thumbnailLink.addEventListener('click', function (event) {
                event.preventDefault(); // 阻止默认跳转行为
                window.open(closestLink.href, '_blank'); // 在新标签页中打开链接
            });

            // 将图片添加到超链接中
            thumbnailLink.appendChild(thumbnail);
            // 将超链接添加到 thumbnailContainer 中
            thumbnailContainer.appendChild(thumbnailLink);
        });
    
    thumbnailContainer.style.display = 'block';
}

function getimageurl_om() {
    // 每次点击都重新生成 thumbnailContainer
    let existingThumbnailContainer = document.getElementById('thumbnailContainer');
    if (existingThumbnailContainer) {
        existingThumbnailContainer.remove();
    }

    let thumbnailContainer = document.createElement('div');
    thumbnailContainer.id = 'thumbnailContainer';
    thumbnailContainer.style.display = 'none';
    thumbnailContainer.style.position = 'fixed';
    thumbnailContainer.style.top = '0';
    thumbnailContainer.style.left = '0';
    thumbnailContainer.style.width = '100%';
    thumbnailContainer.style.height = '100%';
    thumbnailContainer.style.background = 'rgba(0, 0, 0, 0.8)';
    thumbnailContainer.style.zIndex = '1000';
    thumbnailContainer.style.overflow = 'auto';
    document.body.appendChild(thumbnailContainer);

    // 创建六个子容器，根据不同的 actionIdArea 放入不同的容器
    let recommendContainer = document.createElement('div');
    let focusContainer = document.createElement('div');
    let otherContainer = document.createElement('div');
    let plusContainer = document.createElement('div');
    let commonContainer = document.createElement('div');
    let powerContainer = document.createElement('div');
    let 일반영역포커스 = document.createElement('div');

    // 设置容器样式，使图片能够换行显示
    [recommendContainer, focusContainer, otherContainer, powerContainer, plusContainer, commonContainer].forEach(container => {
        container.style.margin = '15px';
        container.style.padding = '10px';
        container.style.background = 'rgba(255, 255, 255, 0.8)';
        container.style.display = 'block'; // 使得图片换行显示
    });

    // 添加标题到各个容器
    recommendContainer.innerHTML = "<h3 style='color: #000;'>추천상품</h3>";
    focusContainer.innerHTML = "<h3 style='color: #000;'>광고</h3>";
    otherContainer.innerHTML = "<h3 style='color: #000;'>컬랙션</h3>";
    powerContainer.innerHTML = "<h3 style='color: #000;'>Power</h3>";
    plusContainer.innerHTML = "<h3 id='plus상품'style='color: #000;'>Plus</h3>";
    commonContainer.innerHTML = "<h3 id='일반상품'style='color: #000;'>일반상품</h3>";
    일반영역포커스.innerHTML = "<h3 id='일반영역포커스'style='color: #000;'>일반영역포커스</h3>";

    // 将各个容器按照顺序添加到主容器
    thumbnailContainer.appendChild(recommendContainer);
    thumbnailContainer.appendChild(focusContainer);
    thumbnailContainer.appendChild(otherContainer); // 将 other 容器放在 focus 和 plus 之间
    thumbnailContainer.appendChild(powerContainer);
    thumbnailContainer.appendChild(plusContainer);
    thumbnailContainer.appendChild(commonContainer);
    thumbnailContainer.appendChild(일반영역포커스);
    
    // 添加点击事件，用于关闭缩略图视图
    thumbnailContainer.addEventListener('click', function (event) {
        if (event.target === thumbnailContainer) {
            thumbnailContainer.style.display = 'none';
            thumbnailContainer.innerHTML = ''; // 清空缩略图内容
        }
    });

    // let images = $('.c-card-item__thumb img').filter(function () {
    //     return $(this).is(':visible') && !$(this).closest('#footer').length;
    // }).toArray();

    let images = $('.c-card-item__thumb img:not(.c-card-item__thumb-emblem img, .c-card-item__swatch-item img)').filter(function () {
    return $(this).is(':visible') && !$(this).closest('#footer').length;
    }).toArray();


    // 先收集所有图片信息，保持原始顺序
    let imageData = [];
    
    images.forEach((img, index) => {
        // 获取最近的 a 标签
        let closestLink = $(img).closest('li').find('a')[0];
        let focuslink = $(img).closest('li').find('.collection_focus')[0]
        let actionIdArea = ""
        if (!closestLink) return;

        // 获取 a 标签的 data-log-actionid-area 属性
        

        if ($(closestLink).closest("#section_commonPrd").length === 0){
            // section_plusPrd 영역의 상품들은 plus로 분류
            if ($(closestLink).closest("#section_plusPrd").length > 0) {
                actionIdArea = "plus";
            } else {
                actionIdArea = closestLink.getAttribute('data-log-actionid-area');
            }
        } else {
        //    if (closestLink.getAttribute('data-log-actionid-area')=="product"){
        //     actionIdArea = closestLink.getAttribute('data-log-actionid-area');
        //    } else {
            actionIdArea = "common";
        }

        // 跳过指定的图片
        if (actionIdArea === 'ad_highlyrated' || actionIdArea === 'focus_bottom' || actionIdArea === 'connection') return;
        
        // 保存图片数据，包含原始索引
        imageData.push({
            img: img,
            closestLink: closestLink,
            focuslink: focuslink,
            actionIdArea: actionIdArea,
            originalIndex: index
        });
    });

    // 按原始顺序处理每个图片
    imageData.forEach((data, index) => {
        let { img, closestLink, focuslink, actionIdArea } = data;

        // 创建缩略图超链接
        let thumbnailLink = document.createElement('a');
        thumbnailLink.style.display = 'inline-block';
        thumbnailLink.style.cursor = 'pointer';

        // 创建缩略图图片
        let thumbnail = document.createElement('img');
        thumbnail.src = img.src;
        thumbnail.style.width = '120px'; // 设置缩略图宽度
        thumbnail.style.height = '120px'; // 设置缩略图高度
        thumbnail.style.margin = '3px'; // 设置间距
        thumbnail.style.transition = 'transform 0.3s ease'; // 添加平滑过渡效果

        // 检查原始图片是否有红色边框
       // let originalImg = $(`img[src="${img.src}"]`).first();
        let hasRedBorder = $(img).css('border-color') === 'rgb(255, 0, 0)' 
        thumbnail.style.border = hasRedBorder ? '2px solid red' : '2px solid transparent';
        thumbnail.classList.add('thumbnail-image'); // 添加类名用于后续操作

        // 添加鼠标悬停效果
        thumbnail.addEventListener('mouseover', function () {
            thumbnail.style.transform = 'scale(1.5)'; // 鼠标悬停时放大1.5倍
        });
        thumbnail.addEventListener('mouseout', function () {
            thumbnail.style.transform = 'scale(1)'; // 鼠标移出时恢复原始大小
        });

        // 添加点击事件，打开链接但不跳转页面
        thumbnailLink.addEventListener('click', function (event) {
            event.preventDefault(); // 阻止默认跳转行为
            window.open(closestLink.href, '_blank'); // 在新标签页中打开链接
        });

        // 将图片添加到超链接中
        thumbnailLink.appendChild(thumbnail);

        if (actionIdArea !== 'recommend' && actionIdArea !== 'focus' && actionIdArea !== 'plus' && actionIdArea !== 'common' && actionIdArea !== 'power') {
            let label = document.createElement('div');
            label.textContent = `${actionIdArea}`;
            label.style.textAlign = 'center';
            label.style.color = '#333';
            label.style.fontSize = '12px';
            label.style.marginTop = '5px';
            thumbnailLink.appendChild(label);
        }

        // 根据 actionIdArea 将图片放入不同的容器
        if (actionIdArea === 'recommend') {
            recommendContainer.appendChild(thumbnailLink);
        } else if (actionIdArea === 'focus' || actionIdArea === 'additional_focus' || actionIdArea === 'AD_FOCUS') {
            let focusLabel = document.createElement('div');
            if (focuslink) {
                focusLabel.textContent = `${focuslink.textContent}`;
                focusLabel.style.position = 'absolute';  // 绝对定位
                focusLabel.style.bottom = '5px';         // 距离底部5px
                focusLabel.style.left = '5px';           // 距离左边5px
                focusLabel.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'; // 白色半透明背景
                focusLabel.style.color = '#ff0000';      // 字体颜色为红色
                focusLabel.style.padding = '2px 5px';    // 添加内边距
                focusLabel.style.borderRadius = '3px';   // 圆角效果
                focusLabel.style.fontSize = '12px';      // 字体大小
                focusLabel.style.zIndex = '10';          // 确保标签显示在图片上方
                focusLabel.style.fontWeight = 'bold';    // 粗体
            
                // 创建一个容器以便包含图片和标签
                let thumbnailContainer = document.createElement('div');
                thumbnailContainer.style.position = 'relative'; // 让子元素相对定位
                thumbnailContainer.style.display = 'inline-block';
            
                // 将图片和标签添加到这个新容器中
                thumbnailContainer.appendChild(thumbnail);
                thumbnailContainer.appendChild(focusLabel); // 添加标签到容器中
            
                // 将容器添加到链接中
                thumbnailLink.appendChild(thumbnailContainer);
            }
            
            focusContainer.appendChild(thumbnailLink);
            
        } else if (actionIdArea === 'plus') {
            plusContainer.appendChild(thumbnailLink);
        } else if (actionIdArea === 'common' || actionIdArea === 'pm_research') {
            commonContainer.appendChild(thumbnailLink);
        } else if (actionIdArea === 'power') {
            powerContainer.appendChild(thumbnailLink); // 如果 actionIdArea 为 power，添加到 powerContainer
        } else {
            otherContainer.appendChild(thumbnailLink); // 其他的放入其他容器
        }
    });

    // 检查每个容器是否有图片，如果没有则隐藏
    [recommendContainer, focusContainer, otherContainer, plusContainer, commonContainer, powerContainer].forEach(container => {
        if (container.children.length < 2) {
            container.style.display = 'none'; // 没有内容则隐藏容器
        }
    });

    thumbnailContainer.style.display = 'block';
    document.querySelector("#일반상품").innerHTML = `일반상품  + ${commonContainer.children.length - 1}`;
    document.querySelector("#plus상품").innerHTML = `plus  + ${plusContainer.children.length - 1}`;
}


function gotoimage_om() {
    let thumbnailContainer = document.getElementById('thumbnailContainer');

    // 如果 thumbnailContainer 已经存在且可见，直接退出函数
    if (thumbnailContainer && thumbnailContainer.style.display === 'block') {
        thumbnailContainer.style.display = 'none';
        thumbnailContainer.innerHTML = ''; // 清空内容
        return;
    }

    // 每次点击都重新生成 thumbnailContainer
    if (thumbnailContainer) {
        thumbnailContainer.remove();
    }

    thumbnailContainer = document.createElement('div');
    thumbnailContainer.id = 'thumbnailContainer';
    thumbnailContainer.style.display = 'none';
    thumbnailContainer.style.position = 'fixed';
    thumbnailContainer.style.top = '0';
    thumbnailContainer.style.left = '0';
    thumbnailContainer.style.width = '100%';
    thumbnailContainer.style.height = '100%';
    thumbnailContainer.style.background = 'rgba(0, 0, 0, 0.8)';
    thumbnailContainer.style.zIndex = '1000';
    thumbnailContainer.style.overflow = 'auto';
    document.body.appendChild(thumbnailContainer);

    // 创建五个子容器，根据不同的 actionIdArea 放入不同的容器
    let recommendContainer = document.createElement('div');
    let focusContainer = document.createElement('div');
    let otherContainer = document.createElement('div');
    let powerContainer = document.createElement('div');
    let plusContainer = document.createElement('div');
    let commonContainer = document.createElement('div');

    // 设置容器样式，使图片能够换行显示
    [recommendContainer, focusContainer, powerContainer, otherContainer, plusContainer, commonContainer].forEach(container => {
        container.style.margin = '15px';
        container.style.padding = '10px';
        container.style.background = 'rgba(255, 255, 255, 0.8)'
        container.style.display = 'block'; // 使得图片换行显示
    });

    // 添加标题到各个容器
    recommendContainer.innerHTML = "<h3 style='color: #000;'>추천상품</h3>";
    focusContainer.innerHTML = "<h3 style='color: #000;'>광고</h3>";
    otherContainer.innerHTML = "<h3 style='color: #000;'>컬랙션</h3>";
    powerContainer.innerHTML = "<h3 style='color: #000;'>Power</h3>";
    plusContainer.innerHTML = "<h3 id='plus상품'style='color: #000;'>Plus</h3>";
    commonContainer.innerHTML = "<h3 id='일반상품'style='color: #000;'>일반상품</h3>";

    // 将各个容器按照顺序添加到主容器
    thumbnailContainer.appendChild(recommendContainer);
    thumbnailContainer.appendChild(focusContainer);
    thumbnailContainer.appendChild(otherContainer); // 将 other 容器放在 focus 和 plus 之间
    thumbnailContainer.appendChild(powerContainer);
    thumbnailContainer.appendChild(plusContainer);
    thumbnailContainer.appendChild(commonContainer);

    // 添加点击事件，用于关闭缩略图视图
    thumbnailContainer.addEventListener('click', function (event) {
        if (event.target === thumbnailContainer) {
            thumbnailContainer.style.display = 'none';
            thumbnailContainer.innerHTML = ''; // 清空缩略图内容
        }
    });

    let images = $('.c-card-item__thumb img:not(.c-card-item__thumb-emblem img, .c-card-item__swatch-item img)').filter(function () {
       return $(this).is(':visible') && !$(this).closest('#footer').length;
    }).toArray();

    console.log(images.length);

    // 先收集所有图片信息，保持原始顺序
    let imageData = [];
    
    images.forEach((img, index) => {
        let closestLink = $(img).closest('li').find('a')[0];
        let focuslink = $(img).closest('li').find('.collection_focus')[0]
        let actionIdArea = ""
        if (!closestLink) return;
        if ($(closestLink).closest("#section_commonPrd").length === 0){
            // section_plusPrd 영역의 상품들은 plus로 분류
            if ($(closestLink).closest("#section_plusPrd").length > 0) {
                actionIdArea = "plus";
            } else {
                actionIdArea = closestLink.getAttribute('data-log-actionid-area');
            }
        } else {
        //    if (closestLink.getAttribute('data-log-actionid-area')=="product"){
        //     actionIdArea = closestLink.getAttribute('data-log-actionid-area');
        //    } else {
            actionIdArea = "common";
        }
        
    
        // 跳过指定的图片
        if (actionIdArea === 'ad_highlyrated' || actionIdArea === 'focus_bottom' || actionIdArea === 'connection') return;
        
        // 保存图片数据，包含原始索引
        imageData.push({
            img: img,
            closestLink: closestLink,
            focuslink: focuslink,
            actionIdArea: actionIdArea,
            originalIndex: index
        });
    });

    // 按原始顺序处理每个图片
    imageData.forEach((data, index) => {
        let { img, closestLink, focuslink, actionIdArea } = data;
    
        let thumbnailLink = document.createElement('a');
        thumbnailLink.style.display = 'inline-block';
        thumbnailLink.style.cursor = 'pointer';
    
        let thumbnail = document.createElement('img');
        thumbnail.src = img.src;
        thumbnail.style.width = '120px';
        thumbnail.style.height = '120px';
        thumbnail.style.margin = '3px';
        thumbnail.style.transition = 'transform 0.3s ease'; // 添加平滑过渡效果


        // 检查原始图片是否有红色边框
       // let originalImg = $(`img[src="${img.src}"]`).first();
        let hasRedBorder = $(img).css('border-color') === 'rgb(255, 0, 0)' 
        thumbnail.style.border = hasRedBorder ? '2px solid red' : '2px solid transparent';
        thumbnail.classList.add('thumbnail-image'); // 添加类名用于后续操作

        // 添加鼠标悬停效果
        thumbnail.addEventListener('mouseover', function () {
            thumbnail.style.transform = 'scale(1.2)'; // 鼠标悬停时放大1.2倍
        });
        thumbnail.addEventListener('mouseout', function () {
            thumbnail.style.transform = 'scale(1)'; // 鼠标移出时恢复原始大小
        });
    
        // 添加点击事件，滚动到对应的图片位置
        thumbnailLink.addEventListener('click', function (event) {
            event.preventDefault(); // 阻止默认行为
            img.scrollIntoView({ behavior: 'smooth', block: 'center' });
            setTimeout(function () {
                thumbnailContainer.style.display = 'none';
            }, 200); // 等待200毫秒后关闭
        });
        

         
        thumbnailLink.appendChild(thumbnail);
        
        if (actionIdArea !== 'recommend' && actionIdArea !== 'focus' && actionIdArea !== 'plus' && actionIdArea !== 'common' && actionIdArea !== 'power') {
            let label = document.createElement('div');
            label.textContent = `${actionIdArea}`;
            label.style.textAlign = 'center';
            label.style.color = '#333';
            label.style.fontSize = '12px';
            label.style.marginTop = '5px';
            thumbnailLink.appendChild(label);
        }

        if (actionIdArea === 'recommend') {
            recommendContainer.appendChild(thumbnailLink);
        } else if (actionIdArea === 'focus' || actionIdArea === 'additional_focus' || actionIdArea === 'AD_FOCUS') {
            let focusLabel = document.createElement('div');
            if (focuslink) {
                focusLabel.textContent = `${focuslink.textContent}`;
                focusLabel.style.position = 'absolute';  // 绝对定位
                focusLabel.style.bottom = '5px';         // 距离底部5px
                focusLabel.style.left = '5px';           // 距离左边5px
                focusLabel.style.backgroundColor = 'rgba(255, 255, 255, 0.8)'; // 白色半透明背景
                focusLabel.style.color = '#ff0000';      // 字体颜色为红色
                focusLabel.style.padding = '2px 5px';    // 添加内边距
                focusLabel.style.borderRadius = '3px';   // 圆角效果
                focusLabel.style.fontSize = '12px';      // 字体大小
                focusLabel.style.zIndex = '10';          // 确保标签显示在图片上方
                focusLabel.style.fontWeight = 'bold';    // 粗体
            
                // 创建一个容器以便包含图片和标签
                let thumbnailContainer = document.createElement('div');
                thumbnailContainer.style.position = 'relative'; // 让子元素相对定位
                thumbnailContainer.style.display = 'inline-block';
            
                // 将图片和标签添加到这个新容器中
                thumbnailContainer.appendChild(thumbnail);
                thumbnailContainer.appendChild(focusLabel); // 添加标签到容器中
            
                // 将容器添加到链接中
                thumbnailLink.appendChild(thumbnailContainer);
            }
            
            focusContainer.appendChild(thumbnailLink);
            
        } else if (actionIdArea === 'plus') {
            plusContainer.appendChild(thumbnailLink);
        } else if (actionIdArea === 'common' || actionIdArea === 'pm_research') {
            commonContainer.appendChild(thumbnailLink);
        } else if (actionIdArea === 'power') {
            powerContainer.appendChild(thumbnailLink); // 如果 actionIdArea 为 power，添加到 powerContainer
        } else {
            otherContainer.appendChild(thumbnailLink); // 其他的放入 other 容器
        }
    });
   

    // 检查每个容器是否有图片，如果没有则隐藏
    [recommendContainer, focusContainer, otherContainer, plusContainer, powerContainer, commonContainer].forEach(container => {
        if (container.children.length < 2) {
            container.style.display = 'none'; // 没有内容则隐藏容器
        }
    });
    
    thumbnailContainer.style.display = 'block';
    document.querySelector("#일반상품").innerHTML = `일반상품  + ${commonContainer.children.length - 1}`
    document.querySelector("#plus상품").innerHTML = `plus  + ${plusContainer.children.length - 1}`
}


function toggleThumbnailContainer() {
    let thumbnailContainer = document.getElementById('thumbnailContainer');
    if (thumbnailContainer && thumbnailContainer.style.display === 'block') {
        thumbnailContainer.style.display = 'none';
        thumbnailContainer.innerHTML = ''; // 清空内容
    } else {
        if(location.href.includes('amazontab')){
            gotoimage_amazon();
        } else {
            gotoimage_om();
        }
    }
}

// 监听按键事件
$(document).on('keydown', function (event) {
    // 检查是否按下了 "~" 键
    if (event.key === '`' || event.key === '~') {
        toggleThumbnailContainer();
        removelazy();
    }
});

