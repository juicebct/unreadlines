document.addEventListener('DOMContentLoaded', function () {
    let currentDialogId = null;
    let currentSequence = 1;
    let points = 0;
    let completedDialogs = [];
    let activeDialogs = [];
    let userResponses = [];
    let allDialogs = [];
    let branchesData = {};
    const shownBlackScreens = new Set();
    let chatHistories = {};
    let userName = '';
    let answerTimeoutId = null;
    let shownMessages = {};
    const dialogsContainer = document.querySelector('.dialog-list');
    const chatContainer = document.getElementById('messages-list');
    const resetButton = document.getElementById('reset-progress-button');
    const gameContainer = document.querySelector('.game-container');
    let isUserScrolling = false;
    let autoScrollEnabled = true;
    let scrollTimeout = null;

    userName = localStorage.getItem('userName') || '';
    if (!userName) {
        showNameInputModal();
    } else {
        initGame();
    }

    function showNameInputModal() {
        if (gameContainer) gameContainer.style.display = 'none';
        const modal = document.createElement('div');
        modal.className = 'name-input-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Lūdzu, ievadiet savu vārdu.</h2>
                <input type="text" id="name-input" placeholder="Jūsu vārds" maxlength="20">
                <button id="submit-name">Turpināt</button>
                <br><br>
                <p>Ņemiet vērā, ka šis vārds turpmāk tiks izmantots spēlē, lai uzrunātu jūsu galveno varoni.</p>
            </div>
        `;
        document.body.appendChild(modal);
        document.getElementById('submit-name').addEventListener('click', submitName);
        document.getElementById('name-input').addEventListener('keypress', function (e) {
            if (e.key === 'Enter') submitName();
        });

        function submitName() {
            const nameInput = document.getElementById('name-input');
            const nameValue = nameInput.value.trim();
            if (nameValue) {
                userName = nameValue;
                localStorage.setItem('userName', userName);
                modal.remove();
                if (gameContainer) gameContainer.style.display = 'block';
                initGame();
            } else {
                alert('Kļūda. Lūdzu, ievadiet vārdu.');
            }
        }
    }

    function saveProgress() {
        localStorage.setItem('gameProgress', JSON.stringify({
            currentDialogId,
            currentSequence,
            points,
            completedDialogs,
            activeDialogs,
            userResponses,
            chatHistories,
            shownMessages
        }));
    }

    function loadProgress() {
        const progress = JSON.parse(localStorage.getItem('gameProgress'));
        if (progress) {
            currentDialogId = progress.currentDialogId || null;
            currentSequence = progress.currentSequence || 1;
            points = progress.points || 0;
            completedDialogs = progress.completedDialogs || [];
            activeDialogs = progress.activeDialogs || [];
            userResponses = progress.userResponses || [];
            chatHistories = progress.chatHistories || {};
            shownMessages = progress.shownMessages || {};
            shownBlackScreens.clear();
            userResponses.forEach(response => {
                if (response.type === 'black-screen') shownBlackScreens.add(`${response.dialogId}-${response.sequence}`);
            });
        }
    }

    function resetProgress() {
        localStorage.removeItem('gameProgress');
        localStorage.removeItem('userName');
        userName = '';
        currentDialogId = null;
        currentSequence = 1;
        points = 0;
        completedDialogs = [];
        activeDialogs = [];
        userResponses = [];
        chatHistories = {};
        shownMessages = {};
        shownBlackScreens.clear();
    }

    function resetProgressAndReload() {
        if (confirm("Sākt jaunu spēli.\n\nVai jūs esat pārliecināti, ka vēlaties atiestatīt savu progresu? Visi dati tiks zaudēti.")) {
            resetProgress();
            location.reload();
        }
    }

    function smartScroll(element) {
        if (!autoScrollEnabled) return;
        
        element.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }

    function handleUserScroll() {
        isUserScrolling = true;
        autoScrollEnabled = false;
        
        if (scrollTimeout) clearTimeout(scrollTimeout);
        
        scrollTimeout = setTimeout(() => {
            const isAtBottom = Math.abs(chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight) < 10;
            
            if (isAtBottom) {
                isUserScrolling = false;
                autoScrollEnabled = true;
            }
        }, 2000);
    }

    function initGame() {
        if (resetButton) resetButton.addEventListener('click', resetProgressAndReload);
        loadProgress();
        updateDialogsList();
        
        chatContainer.addEventListener('scroll', handleUserScroll);
        chatContainer.addEventListener('wheel', () => {
            isUserScrolling = true;
            autoScrollEnabled = false;
        });
        chatContainer.addEventListener('touchmove', () => {
            isUserScrolling = true;
            autoScrollEnabled = false;
        });
        
        fetch('data.json')
            .then(response => response.json())
            .then(data => {
                allDialogs = data.dialogs;
                branchesData = data.branches || {};
                allDialogs.forEach(dialog => {
                    if (dialog.questions) {
                        dialog.questions.forEach(question => {
                            if (question.message) question.message = question.message.replace(/{userName}/g, userName);
                            if (question.answers) {
                                question.answers.forEach(answer => {
                                    if (answer.text) answer.text = answer.text.replace(/{userName}/g, userName);
                                });
                            }
                        });
                    }
                });
                Object.keys(branchesData).forEach(branchId => {
                    if (branchesData[branchId]) {
                        branchesData[branchId].forEach(message => {
                            if (message.message) message.message = message.message.replace(/{userName}/g, userName);
                        });
                    }
                });
                if (allDialogs.length > 0) {
                    if (!currentDialogId) {
                        loadDialog(allDialogs[0].id);
                        if (!activeDialogs.includes(allDialogs[0].id)) {
                            activeDialogs.push(allDialogs[0].id);
                        }
                    } else {
                        if (!activeDialogs.includes(currentDialogId) && !completedDialogs.includes(currentDialogId)) {
                            activeDialogs.push(currentDialogId);
                        }
                        loadDialog(currentDialogId);
                    }
                    updateDialogsList();
                }
            })
            .catch(error => {
                console.error('Error loading data.json:', error);
            });
    }

    function updateDialogsList() {
        dialogsContainer.innerHTML = '';
        activeDialogs = activeDialogs.filter(id => !completedDialogs.includes(id));
        saveProgress();
        allDialogs.forEach(dialog => {
            const isActive = activeDialogs.includes(dialog.id);
            const isCurrent = dialog.id === currentDialogId;
            const isCompleted = completedDialogs.includes(dialog.id);
            if (isActive || isCompleted) {
                let lastVisibleBotMessage = '';
                const dialogHistory = chatHistories[dialog.id] || [];
                const lastBotMessage = [...dialogHistory].reverse().find(msg =>
                    msg.type === 'question' || msg.type === 'branch-message'
                );
                if (lastBotMessage) {
                    lastVisibleBotMessage = lastBotMessage.message;
                } else if (isActive) {
                    const firstQuestion = dialog.questions.find(q => q.sequence === 1);
                    if (firstQuestion) {
                        lastVisibleBotMessage = firstQuestion.message;
                    }
                }
                const previewText = lastVisibleBotMessage
                    ? (lastVisibleBotMessage.length > 30
                        ? lastVisibleBotMessage.substring(0, 30).replace(/<[^>]*>?/gm, '') + '...'
                        : lastVisibleBotMessage.replace(/<[^>]*>?/gm, ''))
                    : 'Spiediet, lai atvērtu dialogu';
                const dialogElement = document.createElement('a');
                dialogElement.href = '#';
                dialogElement.classList.add('dialog-message');
                dialogElement.setAttribute('data-dialog-id', dialog.id);
                if (isCurrent && !isCompleted) {
                    dialogElement.classList.add('active');
                }
                const avatar = document.createElement('img');
                avatar.src = dialog.avatar_path;
                avatar.alt = '';
                const dialogInfo = document.createElement('div');
                dialogInfo.classList.add('dialog-message-info');
                const title = document.createElement('h2');
                title.textContent = dialog.name;
                const preview = document.createElement('p');
                preview.textContent = previewText;
                dialogInfo.appendChild(title);
                dialogInfo.appendChild(preview);
                const oldBadge = dialogInfo.querySelector('.active-badge');
                if (oldBadge) oldBadge.remove();
                if (isCurrent && isActive && !isCompleted) {
                    const badge = document.createElement('span');
                    badge.classList.add('active-badge');
                    badge.textContent = 'Aktīvs dialogs';
                    dialogInfo.appendChild(badge);
                }
                dialogElement.appendChild(avatar);
                dialogElement.appendChild(dialogInfo);
                dialogElement.addEventListener('click', () => loadDialog(dialog.id));
                dialogsContainer.appendChild(dialogElement);
            }
        });
    }

    function renderChatHistory(dialogId) {
        const history = chatHistories[dialogId] || [];
        chatContainer.innerHTML = '';
        history.forEach(item => {
            if (item.type === 'black-screen') return;
            const element = document.createElement('div');
            element.classList.add('message');
            element.dataset.sequence = item.sequence;
            if (item.type === 'question' || item.type === 'branch-message') {
                element.id = 'received';
                element.innerHTML = `
                    <img src="${item.avatar_path || 'images/default.svg'}" alt="">
                    <div class="message-info">
                        <h2>${item.sender_name}</h2>
                        <p>${item.message}</p>
                    </div>
                `;
            } else if (item.type === 'user-response') {
                element.id = 'sent';
                const displayText = item.displayText || item.text;
                element.innerHTML = `
                    <div class="message-info">
                        <h2>Jūs</h2>
                        <p>${displayText}</p>
                    </div>
                `;
            }
            chatContainer.appendChild(element);
        });
        if (chatContainer.lastElementChild) {
            smartScroll(chatContainer.lastElementChild);
        }
    }

    function displayQuestion(question, dialog, showAnswers) {
        if (question.type === "black-screen") {
            showBlackScreen(question, dialog, showAnswers);
            return;
        }
        const key = `${question.sequence}_${question.message}`;
        if (!shownMessages[dialog.id][key]) {
            shownMessages[dialog.id][key] = true;
            saveProgress();
        }
        const questionData = {
            dialogId: dialog.id,
            sender_name: question.sender_name,
            avatar_path: question.avatar_path,
            message: question.message,
            sequence: question.sequence,
            type: 'question'
        };
        if (!chatHistories[dialog.id].some(item =>
            item.type === 'question' &&
            item.sequence === question.sequence &&
            item.message === question.message
        )) {
            chatHistories[dialog.id].push(questionData);
            userResponses.push(questionData);
            saveProgress();
        }
        const questionElement = document.createElement('div');
        questionElement.classList.add('message');
        questionElement.id = 'received';
        questionElement.dataset.sequence = question.sequence;
        questionElement.innerHTML = `
            <img src="${question.avatar_path}" alt="">
            <div class="message-info">
                <h2>${question.sender_name}</h2>
                <p>${question.message}</p>
            </div>
        `;
        chatContainer.appendChild(questionElement);
        smartScroll(questionElement);
        if (showAnswers && question.answers?.length > 0) showAnswerOptions(question);
    }

    function showAnswerOptions(question, defer = false) {
        document.querySelectorAll('.answer-box').forEach(box => box.remove());
        if (!question.answers?.length) return;
        const render = () => {
            const answersContainer = document.createElement('div');
            answersContainer.classList.add('answer-box');
            answersContainer.innerHTML = '<h2>IZVĒLIETIES ATBILDES VARIANTU:</h2>';
            const answersList = document.createElement('div');
            answersList.classList.add('answer-select');
            question.answers.forEach(answer => {
                const answerElement = document.createElement('a');
                answerElement.href = '#';
                answerElement.classList.add('answer-variant');
                answerElement.innerHTML = `<p>${answer.text}</p>`;
                answerElement.addEventListener('click', () => {
                    selectAnswer(allDialogs.find(d => d.id === currentDialogId), answer, question);
                });
                answersList.appendChild(answerElement);
            });
            answersContainer.appendChild(answersList);
            chatContainer.appendChild(answersContainer);
            smartScroll(answersContainer);
        };
        if (defer) setTimeout(render, 1000);
        else render();
    }

    function displayUserResponse(text, dialog, sequence) {
        const userResponse = {
            dialogId: dialog.id,
            text: text,
            displayText: text,
            sequence: sequence,
            type: 'user-response'
        };
        chatHistories[dialog.id].push(userResponse);
        userResponses.push(userResponse);
        saveProgress();
        renderChatHistory(dialog.id);
    }

    function selectAnswer(dialog, answer, question) {
        points += answer.points;
        displayUserResponse(answer.text, dialog, question.sequence);
        if (answer.branch_id && branchesData[answer.branch_id]) {
            showBranchMessages(answer.branch_id, question, dialog);
        } else {
            document.querySelectorAll('.answer-box').forEach(box => box.remove());
            setTimeout(() => {
                currentSequence = question.sequence + 1;
                proceedToNextQuestion();
                updateDialogsList();
            }, 500);
        }
        updateDialogsList();
    }

    function showBranchMessages(branchId, question, dialog) {
        if (!window.branchTimeouts) window.branchTimeouts = [];
        window.branchTimeouts.forEach(timeout => clearTimeout(timeout));
        window.branchTimeouts = [];
        document.querySelectorAll('.answer-box').forEach(box => box.remove());
        const branchMessages = branchesData[branchId];
        if (!shownMessages[dialog.id]) shownMessages[dialog.id] = {};
        const messagesToShow = branchMessages.filter(msg => {
            const key = `branch_${branchId}_${msg.message}`;
            return !shownMessages[dialog.id][key];
        });
        if (messagesToShow.length === 0) {
            currentSequence = question.sequence + 1;
            proceedToNextQuestion();
            return;
        }
        let totalDelay = Math.floor(Math.random() * 3000) + 1000;
        const firstMsg = messagesToShow[0];
        const firstKey = `branch_${branchId}_${firstMsg.message}`;
        shownMessages[dialog.id][firstKey] = true;
        const firstTimeoutId = setTimeout(() => {
            if (currentDialogId === dialog.id) {
                const branchMessage = {
                    dialogId: dialog.id,
                    sender_name: firstMsg.sender_name,
                    avatar_path: firstMsg.avatar_path,
                    message: firstMsg.message,
                    sequence: question.sequence,
                    branchId: branchId,
                    type: 'branch-message'
                };
                chatHistories[dialog.id].push(branchMessage);
                userResponses.push(branchMessage);
                saveProgress();
                const element = document.createElement('div');
                element.classList.add('message');
                element.id = 'received';
                element.dataset.sequence = question.sequence;
                element.innerHTML = `
                    <img src="${firstMsg.avatar_path || 'images/default.svg'}" alt="">
                    <div class="message-info">
                        <h2>${firstMsg.sender_name}</h2>
                        <p>${firstMsg.message}</p>
                    </div>
                `;
                chatContainer.appendChild(element);
                smartScroll(element);
            }
        }, totalDelay);
        window.branchTimeouts.push(firstTimeoutId);
        for (let i = 1; i < messagesToShow.length; i++) {
            const delay = Math.floor(Math.random() * 3000) + 1000;
            totalDelay += delay;
            const msg = messagesToShow[i];
            const msgKey = `branch_${branchId}_${msg.message}`;
            shownMessages[dialog.id][msgKey] = true;
            const msgTimeoutId = setTimeout(() => {
                if (currentDialogId === dialog.id) {
                    const branchMessage = {
                        dialogId: dialog.id,
                        sender_name: msg.sender_name,
                        avatar_path: msg.avatar_path,
                        message: msg.message,
                        sequence: question.sequence,
                        branchId: branchId,
                        type: 'branch-message'
                    };
                    chatHistories[dialog.id].push(branchMessage);
                    userResponses.push(branchMessage);
                    saveProgress();
                    const element = document.createElement('div');
                    element.classList.add('message');
                    element.id = 'received';
                    element.dataset.sequence = question.sequence;
                    element.innerHTML = `
                        <img src="${msg.avatar_path || 'images/default.svg'}" alt="">
                        <div class="message-info">
                            <h2>${msg.sender_name}</h2>
                            <p>${msg.message}</p>
                        </div>
                    `;
                    chatContainer.appendChild(element);
                    smartScroll(element);
                }
            }, totalDelay);
            window.branchTimeouts.push(msgTimeoutId);
        }
        const proceedTimeoutId = setTimeout(() => {
            if (currentDialogId === dialog.id) {
                currentSequence = question.sequence + 1;
                proceedToNextQuestion();
            }
        }, totalDelay + 300);
        window.branchTimeouts.push(proceedTimeoutId);
    }

    function proceedToNextQuestion() {
        isUserScrolling = false;
        autoScrollEnabled = true;
        
        const nextDialog = allDialogs.find(d => d.questions.some(q => q.sequence === currentSequence));
        if (nextDialog) {
            if (nextDialog.id !== currentDialogId) {
                const currentDialogElement = document.querySelector(`.dialog-message[data-dialog-id="${currentDialogId}"]`);
                if (currentDialogElement) {
                    currentDialogElement.classList.remove('active');
                    const badge = currentDialogElement.querySelector('.active-badge');
                    if (badge) badge.remove();
                }
                alert(`Jums ir jauns ziņojums no ${nextDialog.name}`);
            }
            if (!activeDialogs.includes(nextDialog.id) && !completedDialogs.includes(nextDialog.id)) {
                activeDialogs.push(nextDialog.id);
                saveProgress();
            }
            loadDialog(nextDialog.id);
            updateDialogsList();
        } else {
            endGame();
        }
    }

    function completeDialog(dialog) {
        if (!completedDialogs.includes(dialog.id)) {
            completedDialogs.push(dialog.id);
        }
        const index = activeDialogs.indexOf(dialog.id);
        if (index !== -1) {
            activeDialogs.splice(index, 1);
        }
        saveProgress();
        updateDialogsList();
        const element = document.createElement('div');
        element.classList.add('message');
        element.innerHTML = '<p>Šis dialogs ir pabeigts. Atbildes nav pieejamas.</p>';
        chatContainer.appendChild(element);
    }

    function endGame() {
        localStorage.setItem('finalPoints', points);
        resetProgress();
        window.location.href = 'gameover.html';
    }

    function loadDialog(dialogId) {
        if (currentDialogId && currentDialogId !== dialogId) {
            const prevDialogElement = document.querySelector(`.dialog-message[data-dialog-id="${currentDialogId}"]`);
            if (prevDialogElement) {
                prevDialogElement.classList.remove('active');
                const prevBadge = prevDialogElement.querySelector('.active-badge');
                if (prevBadge) prevBadge.remove();
            }
        }
        if (answerTimeoutId) {
            clearTimeout(answerTimeoutId);
            answerTimeoutId = null;
        }
        if (!window.messageTimeouts) window.messageTimeouts = [];
        window.messageTimeouts.forEach(timeout => clearTimeout(timeout));
        document.querySelectorAll('.answer-box').forEach(box => box.remove());
        currentDialogId = dialogId;
        chatContainer.innerHTML = '';
        if (!chatHistories[dialogId]) chatHistories[dialogId] = [];
        if (!shownMessages[dialogId]) shownMessages[dialogId] = {};
        const profileInfo = document.querySelector('.header');
        if (profileInfo) {
            const dialog = allDialogs.find(d => d.id === dialogId);
            if (dialog) profileInfo.innerHTML = `<img src="${dialog.avatar_path}" alt=""><h2>${dialog.name}</h2>`;
        }
        renderChatHistory(dialogId);
        const dialog = allDialogs.find(d => d.id === dialogId);
        if (dialog) {
            const currentQuestions = dialog.questions.filter(q => q.sequence === currentSequence);
            const questionsToShow = currentQuestions.filter(question => {
                const key = `${question.sequence}_${question.message}`;
                return !shownMessages[dialogId][key];
            });
            let totalDelay = 0;
            questionsToShow.forEach((question, index) => {
                const isFirstMessageInDialog = !chatHistories[dialog.id].some(item => item.type === 'question');
                if (question.type === "black-screen") {
                    displayQuestion(question, dialog, false);
                } else {
                    if (isFirstMessageInDialog) {
                        displayQuestion(question, dialog, false);
                    } else {
                        const delay = Math.floor(Math.random() * 3000) + 1000;
                        totalDelay += delay;
                        const timeoutId = setTimeout(() => {
                            if (currentDialogId === dialogId) {
                                displayQuestion(question, dialog, false);
                            }
                        }, totalDelay);
                        window.messageTimeouts.push(timeoutId);
                    }
                }
            });
            if (questionsToShow.length > 0) {
                const lastQuestion = questionsToShow[questionsToShow.length - 1];
                answerTimeoutId = setTimeout(() => {
                    if (currentDialogId === dialogId) {
                        showAnswerOptions(lastQuestion);
                        answerTimeoutId = null;
                    }
                }, totalDelay + 500);
                window.messageTimeouts.push(answerTimeoutId);
            } else if (currentQuestions.length > 0) {
                const lastQuestion = currentQuestions[currentQuestions.length - 1];
                showAnswerOptions(lastQuestion);
            } else {
                if (currentDialogId === dialogId) {
                    completeDialog(currentDialog);
                    updateDialogsList();
                }
            }
        }
    }

    function showBlackScreen(question, dialog, isCurrentQuestion) {
        const screenKey = `${dialog.id}-${question.sequence}`;
        if (shownBlackScreens.has(screenKey)) return;
        const blackScreen = document.createElement('div');
        blackScreen.className = 'black-screen';
        if (question.avatar_path) {
            blackScreen.style.backgroundColor = `rgba(0, 0, 0, 0.7)`;
            blackScreen.style.backgroundImage = `url('${question.avatar_path}')`;
            blackScreen.style.backgroundSize = 'cover';
            blackScreen.style.backgroundPosition = 'center';
            blackScreen.style.backgroundRepeat = 'no-repeat';
            blackScreen.style.backgroundBlendMode = 'overlay';
        }
        const messageContent = document.createElement('div');
        messageContent.className = 'message';
        messageContent.innerHTML = question.message;
        blackScreen.appendChild(messageContent);
        const quoteContainer = document.createElement('div');
        quoteContainer.className = 'black-screen-quote';
        blackScreen.appendChild(quoteContainer);
        fetch('phrases.json')
            .then(response => response.json())
            .then(data => {
                if (data.quotes && data.quotes.length > 0) {
                    const randomQuote = data.quotes[Math.floor(Math.random() * data.quotes.length)];
                    quoteContainer.innerHTML = `
                        <p class="quote-text">"${randomQuote.text}"</p>
                        <p class="quote-author">— ${randomQuote.author}</p>
                    `;
                }
            })
            .catch(error => console.error('Error loading quotes:', error));
        if (question.answers?.length > 0) {
            const btn = document.createElement('button');
            btn.className = 'continue-btn';
            btn.textContent = question.answers[0].text;
            btn.addEventListener('click', () => {
                blackScreen.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(blackScreen);
                    saveProgress();
                    shownBlackScreens.add(screenKey);
                    currentSequence++;
                    proceedToNextQuestion();
                }, 500);
            });
            blackScreen.appendChild(btn);
        }
        document.body.appendChild(blackScreen);
        void blackScreen.offsetWidth;
        blackScreen.classList.add('show');
    }
});