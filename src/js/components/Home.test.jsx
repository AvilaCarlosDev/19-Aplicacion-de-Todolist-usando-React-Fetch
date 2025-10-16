import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Home from './Home';

const BASE_URL = 'https://playground.4geeks.com/todo';
const USERNAME = 'Avilacarlosdev';

describe('Home Component - TODO List con integración API', () => {
  beforeEach(() => {
    // Limpiar todos los mocks antes de cada test
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('1. Cargar tareas al iniciar (useEffect con GET)', () => {
    test('debe cargar las tareas desde la API al montar el componente usando GET', async () => {
      const mockTodos = [
        { id: 1, label: 'Tarea desde API 1', done: false },
        { id: 2, label: 'Tarea desde API 2', done: false },
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ todos: mockTodos }),
      });

      render(<Home />);

      // Verificar que se llamó al endpoint correcto con GET
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `${BASE_URL}/users/${USERNAME}`,
          expect.objectContaining({
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          })
        );
      });

      // Verificar que las tareas se muestran en pantalla
      await waitFor(() => {
        expect(screen.getByText('Tarea desde API 1')).toBeInTheDocument();
        expect(screen.getByText('Tarea desde API 2')).toBeInTheDocument();
      });
    });

    test('debe crear un usuario con tareas iniciales si no existe (404)', async () => {
      // Primera llamada: GET retorna 404 (usuario no existe)
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      // Segunda llamada: POST para crear usuario
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ message: 'User created' }),
      });

      // Tercera llamada: GET para obtener tareas después de crear usuario
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          todos: [
            { id: 1, label: 'Make the bed', done: false },
            { id: 2, label: 'Walk the dog', done: false },
          ],
        }),
      });

      render(<Home />);

      // Verificar que se intentó crear el usuario con POST
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `${BASE_URL}/users/${USERNAME}`,
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
          })
        );
      });

      // Verificar que se cargaron las tareas iniciales
      await waitFor(() => {
        expect(screen.getByText('Make the bed')).toBeInTheDocument();
      });
    });

    test('debe mostrar las tareas iniciales mientras carga desde la API', async () => {
      global.fetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ todos: [] }),
                }),
              100
            )
          )
      );

      render(<Home />);

      // Esperar a que termine la carga
      await waitFor(() => {
        expect(screen.getByText('Make the bed')).toBeInTheDocument();
      });
      
      expect(screen.getByText('Walk the dog')).toBeInTheDocument();
      expect(screen.getByText('Do the replits')).toBeInTheDocument();
    });
  });

  describe('2. Agregar una tarea (POST + GET)', () => {
    test('debe agregar una nueva tarea usando POST y luego actualizar con GET', async () => {
      const user = userEvent.setup();

      // Mock para el GET inicial
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ todos: [] }),
      });

      render(<Home />);

      // Esperar a que termine la carga inicial y se muestren las tareas iniciales
      await waitFor(() => {
        expect(screen.getByText('Make the bed')).toBeInTheDocument();
      });

      // Mock para el POST al agregar tarea
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          id: 100,
          label: 'Nueva tarea de prueba',
          done: false,
        }),
      });

      // Mock para el GET después de agregar
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          todos: [{ id: 100, label: 'Nueva tarea de prueba', done: false }],
        }),
      });

      const input = screen.getByPlaceholderText('What needs to be done?');
      await user.type(input, 'Nueva tarea de prueba');
      await user.keyboard('{Enter}');

      // Verificar que se llamó al POST
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `${BASE_URL}/todos/${USERNAME}`,
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              label: 'Nueva tarea de prueba',
              done: false,
            }),
          })
        );
      });

      // Verificar que se llamó al GET para actualizar la lista
      await waitFor(() => {
        const getCalls = global.fetch.mock.calls.filter(
          (call) => call[1]?.method === 'GET'
        );
        expect(getCalls.length).toBeGreaterThan(1);
      });

      // Verificar que la nueva tarea aparece en pantalla
      await waitFor(() => {
        expect(screen.getByText('Nueva tarea de prueba')).toBeInTheDocument();
      });
    });

    test('debe limpiar el input después de agregar una tarea', async () => {
      const user = userEvent.setup();

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ todos: [] }),
      });

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('What needs to be done?')).toBeInTheDocument();
      });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 1, label: 'Test', done: false }),
      });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ todos: [{ id: 1, label: 'Test', done: false }] }),
      });

      const input = screen.getByPlaceholderText('What needs to be done?');
      await user.type(input, 'Test');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    test('no debe agregar tareas vacías', async () => {
      const user = userEvent.setup();

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ todos: [] }),
      });

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('What needs to be done?')).toBeInTheDocument();
      });

      const input = screen.getByPlaceholderText('What needs to be done?');
      await user.type(input, '   ');
      await user.keyboard('{Enter}');

      // No debe haber llamadas POST
      const postCalls = global.fetch.mock.calls.filter(
        (call) => call[1]?.method === 'POST'
      );
      expect(postCalls.length).toBe(0);
    });
  });

  describe('3. Eliminar una tarea (DELETE + GET)', () => {
    test('debe eliminar una tarea usando DELETE y actualizar con GET', async () => {
      const user = userEvent.setup();

      // Mock GET inicial con tareas
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          todos: [
            { id: 1, label: 'Tarea a eliminar', done: false },
            { id: 2, label: 'Tarea a mantener', done: false },
          ],
        }),
      });

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText('Tarea a eliminar')).toBeInTheDocument();
      });

      // Mock DELETE
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      // Mock GET después de eliminar
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          todos: [{ id: 2, label: 'Tarea a mantener', done: false }],
        }),
      });

      // Encontrar y hacer clic en el botón de eliminar
      const deleteButtons = screen.getAllByTitle('Delete task');
      await user.click(deleteButtons[0]);

      // Verificar que se llamó al DELETE
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `${BASE_URL}/todos/1`,
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });

      // Verificar que se llamó al GET para actualizar
      await waitFor(() => {
        const getCalls = global.fetch.mock.calls.filter(
          (call) => call[1]?.method === 'GET'
        );
        expect(getCalls.length).toBeGreaterThan(1);
      });

      // Verificar que la tarea eliminada ya no está
      await waitFor(() => {
        expect(screen.queryByText('Tarea a eliminar')).not.toBeInTheDocument();
        expect(screen.getByText('Tarea a mantener')).toBeInTheDocument();
      });
    });

    test('debe manejar la eliminación de tareas iniciales (sin llamar a DELETE)', async () => {
      const user = userEvent.setup();

      // Mock GET que retorna vacío para que se muestren las iniciales
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ todos: [] }),
      });

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText('Make the bed')).toBeInTheDocument();
      });

      const deleteButtons = screen.getAllByTitle('Delete task');
      const initialCallCount = global.fetch.mock.calls.length;

      await user.click(deleteButtons[0]);

      // No debe haber llamadas DELETE adicionales para tareas iniciales
      await waitFor(() => {
        const deleteCalls = global.fetch.mock.calls
          .slice(initialCallCount)
          .filter((call) => call[1]?.method === 'DELETE');
        expect(deleteCalls.length).toBe(0);
      });

      // La tarea debe desaparecer del DOM
      await waitFor(() => {
        expect(screen.queryByText('Make the bed')).not.toBeInTheDocument();
      });
    });

    test('debe usar String() en taskId para evitar errores con startsWith', async () => {
      const user = userEvent.setup();

      // Mock con ID numérico (no string)
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          todos: [{ id: 123, label: 'Tarea con ID numérico', done: false }],
        }),
      });

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText('Tarea con ID numérico')).toBeInTheDocument();
      });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ todos: [] }),
      });

      const deleteButton = screen.getByTitle('Delete task');
      
      // No debe lanzar error "startsWith is not a function"
      await expect(async () => {
        await user.click(deleteButton);
      }).not.toThrow();

      // Debe llamar al DELETE correctamente
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `${BASE_URL}/todos/123`,
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });
    });
  });

  describe('4. Limpiar todas las tareas (Clear All - DELETE user + POST user vacío)', () => {
    test('debe eliminar todas las tareas con el botón Clear All', async () => {
      const user = userEvent.setup();

      // Mock GET inicial con tareas
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          todos: [
            { id: 1, label: 'Tarea 1', done: false },
            { id: 2, label: 'Tarea 2', done: false },
          ],
        }),
      });

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText('Tarea 1')).toBeInTheDocument();
        expect(screen.getByText('2 items left')).toBeInTheDocument();
      });

      // Mock DELETE user
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      // Mock POST para crear usuario vacío
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({ message: 'User created' }),
      });

      const clearButton = screen.getByText('Clear all');
      await user.click(clearButton);

      // Verificar que se llamó al DELETE del usuario
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `${BASE_URL}/users/${USERNAME}`,
          expect.objectContaining({
            method: 'DELETE',
          })
        );
      });

      // Verificar que se llamó al POST para crear usuario vacío
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          `${BASE_URL}/users/${USERNAME}`,
          expect.objectContaining({
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify([]),
          })
        );
      });

      // Verificar que la lista está vacía
      await waitFor(() => {
        expect(screen.getByText('No tasks, add some!')).toBeInTheDocument();
        expect(screen.getByText('0 items left')).toBeInTheDocument();
      });
    });

    test('el botón Clear All debe estar deshabilitado cuando no hay tareas', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ todos: [] }),
      });

      render(<Home />);

      await waitFor(() => {
        const clearButton = screen.getByText('Clear all');
        expect(clearButton).toBeDisabled();
      });
    });

    test('debe actualizar el contador de tareas correctamente', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          todos: [
            { id: 1, label: 'Tarea 1', done: false },
            { id: 2, label: 'Tarea 2', done: false },
            { id: 3, label: 'Tarea 3', done: false },
          ],
        }),
      });

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText('3 items left')).toBeInTheDocument();
      });
    });

    test('debe mostrar "item" en singular cuando hay 1 tarea', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          todos: [{ id: 1, label: 'Única tarea', done: false }],
        }),
      });

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText('1 item left')).toBeInTheDocument();
      });
    });
  });

  describe('5. Manejo de errores y estados de carga', () => {
    test('debe mostrar estado de carga mientras se obtienen las tareas', async () => {
      global.fetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ todos: [] }),
                }),
              100
            )
          )
      );

      render(<Home />);

      // Debe mostrar loading inicialmente (buscar por role para evitar duplicados)
      const loadingElement = screen.getByRole('status');
      expect(loadingElement).toBeInTheDocument();
      
      // Esperar a que termine la carga
      await waitFor(() => {
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });
    });

    test('debe manejar errores de red al cargar tareas', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      render(<Home />);

      await waitFor(() => {
        expect(
          screen.getByText('Error loading tasks. Showing initial tasks.')
        ).toBeInTheDocument();
      });

      // Debe mostrar las tareas iniciales como fallback
      expect(screen.getByText('Make the bed')).toBeInTheDocument();
    });

    test('debe manejar errores al agregar una tarea', async () => {
      const user = userEvent.setup();

      // Mock GET inicial con tareas existentes
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          todos: [{ id: 1, label: 'Tarea existente', done: false }] 
        }),
      });

      render(<Home />);

      // Esperar a que cargue la tarea existente
      await waitFor(() => {
        expect(screen.getByText('Tarea existente')).toBeInTheDocument();
      });

      // Mock que falla al agregar nueva tarea
      global.fetch.mockRejectedValueOnce(new Error('Server error'));

      const input = screen.getByPlaceholderText('What needs to be done?');
      await user.type(input, 'Tarea con error');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText('Error adding task')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    test('debe manejar errores al eliminar una tarea', async () => {
      const user = userEvent.setup();

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          todos: [{ id: 1, label: 'Tarea', done: false }],
        }),
      });

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText('Tarea')).toBeInTheDocument();
      });

      global.fetch.mockRejectedValueOnce(new Error('Delete error'));

      const deleteButton = screen.getByTitle('Delete task');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText('Error deleting task')).toBeInTheDocument();
      });
    });

    test('debe deshabilitar controles durante la carga', async () => {
      const user = userEvent.setup();

      global.fetch.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: async () => ({ todos: [] }),
                }),
              100
            )
          )
      );

      render(<Home />);

      const input = screen.getByPlaceholderText('What needs to be done?');
      expect(input).toBeDisabled();

      await waitFor(() => {
        expect(input).not.toBeDisabled();
      });
    });
  });

  describe('6. Integración completa - Flujo de usuario', () => {
    test('debe completar un flujo completo: cargar, agregar, eliminar y limpiar', async () => {
      const user = userEvent.setup();

      // 1. Cargar tareas iniciales
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          todos: [{ id: 1, label: 'Tarea existente', done: false }],
        }),
      });

      render(<Home />);

      await waitFor(() => {
        expect(screen.getByText('Tarea existente')).toBeInTheDocument();
      });

      // 2. Agregar nueva tarea
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ id: 2, label: 'Nueva tarea', done: false }),
      });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          todos: [
            { id: 1, label: 'Tarea existente', done: false },
            { id: 2, label: 'Nueva tarea', done: false },
          ],
        }),
      });

      const input = screen.getByPlaceholderText('What needs to be done?');
      await user.type(input, 'Nueva tarea');
      await user.keyboard('{Enter}');

      await waitFor(() => {
        expect(screen.getByText('Nueva tarea')).toBeInTheDocument();
        expect(screen.getByText('2 items left')).toBeInTheDocument();
      });

      // 3. Eliminar una tarea
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          todos: [{ id: 2, label: 'Nueva tarea', done: false }],
        }),
      });

      const deleteButtons = screen.getAllByTitle('Delete task');
      await user.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText('Tarea existente')).not.toBeInTheDocument();
        expect(screen.getByText('1 item left')).toBeInTheDocument();
      });

      // 4. Limpiar todas las tareas
      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 204,
      });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({}),
      });

      const clearButton = screen.getByText('Clear all');
      await user.click(clearButton);

      await waitFor(() => {
        expect(screen.getByText('No tasks, add some!')).toBeInTheDocument();
        expect(screen.getByText('0 items left')).toBeInTheDocument();
      });
    });
  });
});
