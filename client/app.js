
App = {

    contracts: {},

    init: async () => {
        console.log('Loaded');
        await App.loadEthereum();
        await App.loadAccount();
        await App.loadContracts();
        App.render();
        await App.renderTasks()
    },

    loadEthereum: async () => {

        if(window.ethereum){
            App.web3Provider = window.ethereum;
            await App.web3Provider.request({method: 'eth_requestAccounts'});
        } else if (window.web3) {
            web3 = new Web3(window.web3.currentProvider);
        } else {
            console.log('Browser wallet required. Try installing Metamask :)');
        }

    },

    loadAccount: async () => {
        const accounts = await App.web3Provider.request({method: 'eth_requestAccounts'});
        App.account = accounts[0];
    },

    loadContracts: async () => {
        const res = await fetch("TaskContract.json");
        const taskContractJSON = await res.json();
        
        App.contracts.taskContract = TruffleContract(taskContractJSON);

        App.contracts.taskContract.setProvider(App.web3Provider);
     
        App.taskContract = await App.contracts.taskContract.deployed(); 

        
    },

    render: () => {
        document.getElementById('account').innerText = App.account;
    },

    renderTasks: async () => {
        const taskCounterBN = await App.taskContract.taskCounter();
        const taskCounterNumber = taskCounterBN.toNumber();

        let html = '';

        for (let i = 1; i <= taskCounterNumber; i++) {
            const task = await App.taskContract.tasks(i);

            const taskId = task[0];
            const taskTitle = task[1];
            const taskDescription = task[2];
            const taskDone = task[3];
            const taskCreated = task[4];

            let taskElement = `
                <div class="card bg-dark rounded-0 mb-2">
                    <div class="card-header d-flex justify-content-between align-item-center">
                        <span>${taskTitle}</span>
                        <div class="form-check form-switch">
                        <input class="form-check-input" type="checkbox" data-id="${taskId}"
                         ${taskDone && "checked"} onChange="App.toggleDone(this)" />
                    </div>
                    </div>
                    <div class="card-body">
                        <span>${taskDescription}</span>
                        <p  class="text-muted">Task created at: ${new Date(taskCreated * 1000).toLocaleString()}</p>
                    </div>
                </div>
            `

            html += taskElement;
        }

        document.querySelector('#tasksList').innerHTML = html;
    },

    createTask: async (title, description) => {
        
        const result = await App.taskContract.createTask(title, description, 
            {from: App.account} );
        console.log(result);
        
    },

    toggleDone: async (element) => {
        const taskId= element.dataset.id;
        await App.taskContract.toggleDone(taskId, {from: App.account});

        window.location.reload();
    }

}
