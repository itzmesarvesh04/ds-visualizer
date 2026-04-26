export const dsConfig = {
  stack: {
    title: "Stack",
    description: "LIFO (Last In, First Out) structure. Understand push, pop, and peek operations visually.",
    application: {
      title: "Vertical Plate Tub",
      description: "A physical representation of a Stack using plates in a vertical container.",
      scenario: "Plates are pushed into the tub from the top. Pushing beyond capacity causes plates to fall and break. Popping removes the top-most plate."
    },

    quiz: [
      {
        question: "What is the primary principle of a Stack?",
        options: ["FIFO", "LIFO", "LILO", "FILO"],
        answer: 1,
        explanation: "Stack follows LIFO (Last In, First Out) where the last element added is the first one to be removed."
      },
      {
        question: "Which operation is used to add an element to the stack?",
        options: ["Pop", "Peek", "Push", "Enqueue"],
        answer: 2,
        explanation: "The 'Push' operation adds an element to the top of the stack."
      },
      {
        question: "What happens in a 'Stack Overflow' condition?",
        options: ["Stack is empty", "Stack is full", "Stack is corrupted", "None of the above"],
        answer: 1,
        explanation: "Stack Overflow occurs when you try to push an element into a stack that is already at its maximum capacity."
      },
      {
        question: "Which data structure is used to implement recursion?",
        options: ["Queue", "Stack", "Linked List", "Tree"],
        answer: 1,
        explanation: "The function call stack is used by compilers to manage recursive function calls."
      },
      {
        question: "What is the time complexity of the 'Pop' operation?",
        options: ["O(n)", "O(log n)", "O(1)", "O(n^2)"],
        answer: 2,
        explanation: "Pop operation happens at the top of the stack and takes constant time O(1)."
      }
    ]
  },
  queue: {
    title: "Queue",
    description: "FIFO (First In, First Out) structure. Learn enqueue, dequeue, and circular queues effectively.",
    application: {
      title: "Public Service Queue",
      description: "A real-world simulation of people waiting in line for a service.",
      scenario: "People enter the queue from the right (Enqueue) and move forward as the person at the front is served and leaves (Dequeue)."
    },

    quiz: [
      {
        question: "What is the primary principle of a Queue?",
        options: ["LIFO", "FIFO", "LILO", "Random"],
        answer: 1,
        explanation: "Queue follows FIFO (First In, First Out) where the first element added is the first one to be removed."
      },
      {
        question: "Which operation adds an element to the back of the queue?",
        options: ["Push", "Dequeue", "Enqueue", "Pop"],
        answer: 2,
        explanation: "Enqueue adds an element to the 'rear' of the queue."
      },
      {
        question: "In a circular queue, what is the next position after the last index?",
        options: ["Error", "Zero index", "Middle index", "None"],
        answer: 1,
        explanation: "In a circular queue, the front and rear wrap around to the beginning (index 0) using modulo arithmetic."
      },
      {
        question: "Which structure is used for Breadth-First Search (BFS)?",
        options: ["Stack", "Queue", "Priority Queue", "Tree"],
        answer: 1,
        explanation: "BFS uses a Queue to keep track of nodes to visit level by level."
      },
      {
        question: "What is 'Priority Queue'?",
        options: ["A normal queue", "Elements have priorities", "First element is always smallest", "B and C both"],
        answer: 3,
        explanation: "In a Priority Queue, elements are removed based on their priority rather than just arrival order."
      }
    ]
  },
  linkedlist: {
    title: "Linked List",
    description: "Sequential collection of nodes. Master single, double, and circular linked lists with animations.",
    application: {
      title: "Locomotive Assembly",
      description: "A physical representation of a Linked List using train coaches and an engine.",
      scenario: "The engine acts as the 'Head'. Coaches can be added or removed from any position. Links represent the coupling between coaches."
    },

    quiz: [
      {
        question: "What is a 'Node' in a Linked List?",
        options: ["A single value", "Data + Pointer", "Just a pointer", "A function"],
        answer: 1,
        explanation: "A node consists of the data element and a reference (pointer) to the next node in the sequence."
      },
      {
        question: "What is the time complexity to access the N-th element in a Linked List?",
        options: ["O(1)", "O(log n)", "O(n)", "O(1) if head"],
        answer: 2,
        explanation: "Unlike arrays, linked lists require sequential traversal to reach a specific index, resulting in O(n) time."
      },
      {
        question: "Which linked list allows traversal in both directions?",
        options: ["Single Linked List", "Circular Linked List", "Doubly Linked List", "None"],
        answer: 2,
        explanation: "A Doubly Linked List has two pointers per node: 'next' and 'prev'."
      },
      {
        question: "What is the 'Head' of a linked list?",
        options: ["Last node", "Middle node", "First node", "Total size"],
        answer: 2,
        explanation: "The Head is a pointer to the very first node in the linked list."
      },
      {
        question: "A circular linked list's last node points to:",
        options: ["NULL", "Head node", "Previous node", "Middle node"],
        answer: 1,
        explanation: "In a circular linked list, the 'next' pointer of the last node points back to the head node."
      }
    ]
  },
  tree: {
    title: "Tree",
    description: "Hierarchical structures. Understand BST, AVL, and complex traversals.",
    application: {
      title: "File System Hierarchy",
      description: "Operating systems use tree structures to organize folders and files.",
      scenario: "The root directory contains folders (subtrees), which in turn contain more files (leaves) or folders."
    },
    quiz: [
      {
        question: "What is a Binary Tree?",
        options: ["Any hierarchy", "Nodes have at most 2 children", "Nodes have exactly 2 children", "A sorted tree"],
        answer: 1,
        explanation: "In a Binary Tree, each node can have a maximum of two children (left and right)."
      },
      {
        question: "What is the time complexity of searching in a balanced BST?",
        options: ["O(n)", "O(n log n)", "O(log n)", "O(1)"],
        answer: 2,
        explanation: "In a balanced Binary Search Tree, the search space is halved at each step, leading to O(log n) complexity."
      },
      {
        question: "Which traversal visits nodes in non-decreasing order for a BST?",
        options: ["Pre-order", "In-order", "Post-order", "Level-order"],
        answer: 1,
        explanation: "In-order traversal (Left, Root, Right) of a BST always yields sorted data."
      },
      {
        question: "What is a 'Leaf' node?",
        options: ["Root node", "Node with no children", "Node with 2 children", "Node with 1 child"],
        answer: 1,
        explanation: "A leaf node is any node that does not have any child nodes."
      },
      {
        question: "AVL tree is a self-balancing:",
        options: ["Queue", "Stack", "Binary Search Tree", "Linked List"],
        answer: 2,
        explanation: "AVL trees automatically maintain their height during insertions and deletions to ensure O(log n) operations."
      }
    ]
  },
  graph: {
    title: "Graph",
    description: "Network models. Dive deep into BFS, DFS, and Dijkstra's algorithm.",
    application: {
      title: "Social Network / Google Maps",
      description: "Graphs are used to model connections between people or locations.",
      scenario: "Users are vertices, and friendships are edges. In maps, locations are vertices and roads are edges with weights (distance)."
    },
    quiz: [
      {
        question: "What consists of a Graph?",
        options: ["Nodes and Links", "Vertices and Edges", "Points and Lines", "All of the above"],
        answer: 3,
        explanation: "Graphs are formally defined as a set of Vertices (V) and Edges (E)."
      },
      {
        question: "Which algorithm finds the shortest path in a weighted graph?",
        options: ["BFS", "DFS", "Dijkstra's", "In-order"],
        answer: 2,
        explanation: "Dijkstra's algorithm is commonly used to find the shortest path from a source node to all other nodes."
      },
      {
        question: "A graph with no cycles is called:",
        options: ["Cyclic", "Acyclic", "Dense", "Sparse"],
        answer: 1,
        explanation: "A Directed Acyclic Graph (DAG) is a graph that has no cycles."
      },
      {
        question: "What is 'Degree' of a vertex?",
        options: ["Its color", "Number of connected edges", "Its value", "Its height"],
        answer: 1,
        explanation: "The degree is the number of edges incident to the vertex."
      },
      {
        question: "Which traversal uses a Stack?",
        options: ["BFS", "DFS", "Dijkstra", "None"],
        answer: 1,
        explanation: "Depth-First Search (DFS) uses a stack (either explicitly or via recursion)."
      }
    ]
  }
};
