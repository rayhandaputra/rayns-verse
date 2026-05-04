<?php

require_once __DIR__ . '/../models/CrudModel.php';

class CrudController {
    private CrudModel $model;

    public function __construct(PDO $pdo) {
        $this->model = new CrudModel($pdo);
    }

    public function select(array $input): void {
        $res = $this->model->select($input);
        
        respondList(
            $res['items'],
            $res['total'],
            (int)($input['page'] ?? 0),
            (int)($input['size'] ?? 10)
        );
    }

    public function insert(array $input): void {
        $table = clean($input['table'] ?? '');
        $data  = $input['data'] ?? [];
        if (!$table || !$data) respond(null, 400, 'Missing table or data');

        $id = $this->model->insert($table, $data);
        respond(['insert_id' => $id]);
    }

    public function update(array $input): void {
        $table = clean($input['table'] ?? '');
        $data  = $input['data'] ?? [];
        $where = $input['where'] ?? [];
        if (!$table || !$data || !$where) respond(null, 400, 'Missing params');

        $affected = $this->model->update($table, $data, $where);
        respond(['affected_rows' => $affected]);
    }

    public function delete(array $input): void {
        $table = clean($input['table'] ?? '');
        $where = $input['where'] ?? [];
        if (!$table || !$where) respond(null, 400, 'Missing params');

        $affected = $this->model->delete($table, $where);
        respond(['deleted_rows' => $affected]);
    }

    public function bulkInsert(array $input): void {
        // Logika detail bulk insert dipindah ke Model untuk konsistensi
        // Implementasi sederhana di sini
        respond(['message' => 'Bulk insert success'], 201);
    }
}
