Drawing Board — Data Structures Application

Overview  
The Drawing Board is an interactive application built to demonstrate the real-world application of data structures in managing drawing operations. The project focuses on how user actions such as drawing, undoing, redoing, and replaying can be efficiently handled using structured data management.

Features  
- Freehand drawing on a canvas  
- Shape drawing support  
- Undo and redo functionality  
- Clear canvas option  
- Replay of drawing actions  

Data Structures Used  
- Arrays and vectors to store drawing points, strokes, and shapes  
- Stacks to implement undo and redo operations  
- Queues to replay drawing actions in the correct order  

How It Works (Backend Logic)  
Each drawing action performed by the user is stored as an object containing its coordinates, color, and type.  
These objects are pushed into a data structure as the user draws.

- When a new action is performed, it is stored in a vector or array.  
- Undo operations are handled using a stack by popping the most recent action.  
- Redo operations restore actions from a separate stack.  
- Replay functionality processes stored actions sequentially using a queue.  

This approach ensures efficient tracking, modification, and restoration of drawing operations.

Tech Stack  
- Language: C++ / JavaScript (based on implementation)  
- Concepts: Data Structures, Object-Oriented Programming  
- Interface: Console / Web-based drawing canvas  

Learning Outcomes  
- Practical understanding of stacks, queues, arrays, and vectors  
- Experience mapping user interactions to data structures  
- Improved problem-solving and logical design skills  
- Better understanding of backend logic for interactive applications  

License  
This project is developed for educational purposes.
