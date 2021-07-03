window.onload = function() {
  Formio.createForm(document.getElementById('formio'), 'https://bc-pnmbstpsfwdvnhy.form.io/todo').then(function (instance) {
    App.load().then(() => {
      instance.submission = {data: {toDoList: App.tasks}};
      // Render Account
      $('#account').html(App.account)
    })
    instance.on('submit', function (submission) {
      App.createTask(submission.data.content).then(() => {
        window.location.reload();
      })
    });
    instance.on('change', function (event) {
      if (event.changed?.component?.key === 'completed') {
        App.toggleCompleted(event.data.toDoList[event.changed.instance.rowIndex].id).then(() => {
          window.location.reload();
        })
      }
    });
  });
};

App = {
  contracts: {},
  tasks: [],
  load: async () => {
    await App.loadWeb3()
    await App.loadAccount()
    await App.loadContract()
    await App.renderTasks()
  },
  loadWeb3: async () => {
    if (typeof web3 !== 'undefined') {
      App.web3Provider = web3.currentProvider
      web3 = new Web3(web3.currentProvider);
    } else {
      window.alert("Please connect to Metamask.")
    }
    // Modern dapp browsers...
    if (window.ethereum) {
      window.web3 = new Web3(ethereum)
      try {
        // Request account access if needed
        await ethereum.enable()
        // Acccounts now exposed
        web3.eth.sendTransaction({/* ... */})
      } catch (error) {
        // User denied account access...
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = web3.currentProvider
      window.web3 = new Web3(web3.currentProvider)
      // Acccounts always exposed
      web3.eth.sendTransaction({/* ... */})
    }
    // Non-dapp browsers...
    else {
      console.log('Non-Ethereum browser detected. You should consider trying MetaMask!')
    }
  },
  loadAccount: async () => {
    const accounts = await web3.eth.getAccounts()
    web3.eth.defaultAccount = accounts[0];

    App.account = accounts[0]
  },

  renderTasks: async () => {
    // Load the total task count from the blockchain
    const taskCount = await App.todoList.taskCount()
    // Render out each task with a new task template
    for (var i = 1; i <= taskCount; i++) {
      // Fetch the task data from the blockchain
      const task = await App.todoList.tasks(i)
      App.tasks.push({id: task[0].toNumber(),
       task: task[1],
       completed: task[2]})
    }
  },
  loadContract: async () => {
    const todoList = await $.getJSON('TodoList.json')
    App.contracts.TodoList = TruffleContract(todoList)
    App.contracts.TodoList.setProvider(App.web3Provider)
    App.todoList = await App.contracts.TodoList.deployed()
  },
  createTask: async (content) => {
    await App.todoList.createTask(content, {from: App.account});
  },
  toggleCompleted: async (id) => {
    await App.todoList.toggleCompleted(id,  {from: App.account}).catch((e) => window.location.reload());
  },
}
